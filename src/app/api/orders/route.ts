import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyOrderUsers } from "@/lib/notifications";

const schema = z.object({
  offerId: z.string().min(1),
  fulfillmentMode: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour confirmer une commande." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Seuls les particuliers peuvent confirmer une commande." }, { status: 403 });

  try {
    const input = schema.parse(await request.json());
    const offer = await prisma.offer.findUnique({
      where: { id: input.offerId },
      select: {
        id: true, demandId: true, status: true, subtotalCents: true,
        preparationCents: true, deliveryCents: true, fulfillmentModes: true,
        demand: { select: { id: true, customerId: true, status: true, order: { select: { id: true } } } },
      },
    });
    if (!offer || offer.demand.customerId !== user.id) return NextResponse.json({ error: "Proposition introuvable." }, { status: 404 });
    if (offer.demand.order) return NextResponse.json({ error: "Cette demande possède déjà une commande." }, { status: 409 });
    if (!["PROPOSAL_READY", "COLLECTING_OFFERS"].includes(offer.demand.status)) return NextResponse.json({ error: "Cette demande ne peut plus être confirmée." }, { status: 409 });
    if (offer.status !== "SUBMITTED") return NextResponse.json({ error: "Cette proposition n'est plus disponible." }, { status: 409 });
    if (!offer.fulfillmentModes.includes(input.fulfillmentMode)) return NextResponse.json({ error: "Ce commerçant ne propose pas cette modalité de réception." }, { status: 400 });
    if (input.fulfillmentMode === "DELIVERY" && (!input.deliveryAddress || input.deliveryAddress.length < 8)) {
      return NextResponse.json({ error: "Une adresse de livraison complète est nécessaire." }, { status: 400 });
    }

    const totalCents = offer.subtotalCents + offer.preparationCents + (input.fulfillmentMode === "DELIVERY" ? offer.deliveryCents : 0);
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 100000000) {
      return NextResponse.json({ error: "Le montant total de la commande est invalide." }, { status: 400 });
    }

    const order = await prisma.$transaction(async tx => {
      const lock = await tx.demand.updateMany({
        where: { id: offer.demandId, customerId: user.id, status: { in: ["PROPOSAL_READY", "COLLECTING_OFFERS"] } },
        data: { status: "CONFIRMED" },
      });
      if (lock.count !== 1) throw new Error("DEMAND_ALREADY_CONFIRMED");

      const created = await tx.order.create({
        data: {
          demandId: offer.demandId,
          status: "CONFIRMED",
          fulfillmentMode: input.fulfillmentMode,
          deliveryAddress: input.fulfillmentMode === "DELIVERY" ? input.deliveryAddress : null,
          totalCents,
        },
        select: { id: true, status: true, fulfillmentMode: true, totalCents: true, confirmedAt: true },
      });
      await tx.offer.updateMany({
        where: { demandId: offer.demandId, status: "SUBMITTED" },
        data: { status: "REJECTED" },
      });
      await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
      return created;
    });
    await notifyOrderUsers({
      orderId: order.id, eventKey: "order-confirmed", type: "ORDER_CONFIRMED",
      title: "Commande confirmée", message: "Votre commande a été confirmée. Le commerçant peut maintenant la préparer.",
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Informations de commande invalides.", details: error.issues }, { status: 400 });
    if (error instanceof Error && error.message === "DEMAND_ALREADY_CONFIRMED") return NextResponse.json({ error: "Cette demande a déjà été confirmée." }, { status: 409 });
    console.error("POST /api/orders", error);
    return NextResponse.json({ error: "Impossible de confirmer cette commande." }, { status: 500 });
  }
}
