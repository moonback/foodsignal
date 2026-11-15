import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"]),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });

  try {
    const input = schema.parse(await request.json());
    const seller = await prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true, isActive: true } });
    if (!seller || !seller.isActive) return NextResponse.json({ error: "Votre établissement doit être actif." }, { status: 403 });

    const order = await prisma.order.findFirst({
      where: { id: input.orderId, demand: { offers: { some: { sellerId: seller.id, status: "ACCEPTED" } } } },
      select: { id: true, status: true, paymentStatus: true, fulfillmentMode: true },
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable pour votre établissement." }, { status: 404 });

    if (order.paymentStatus !== "PAID") return NextResponse.json({ error: "La préparation est bloquée tant que le paiement n'est pas confirmé par Stripe." }, { status: 409 });

    const transitions: Record<string, string[]> = {
      CONFIRMED: ["PREPARING"],
      PREPARING: order.fulfillmentMode === "DELIVERY" ? ["OUT_FOR_DELIVERY"] : ["READY"],
      READY: ["COMPLETED"],
      OUT_FOR_DELIVERY: ["COMPLETED"],
    };
    if (!transitions[order.status]?.includes(input.status)) {
      return NextResponse.json({ error: "Cette transition de statut n'est pas autorisée." }, { status: 409 });
    }

    const changed = await prisma.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: input.status },
    });
    if (changed.count !== 1) return NextResponse.json({ error: "La commande a été modifiée entre-temps. Actualisez la page." }, { status: 409 });
    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: { id: true, status: true, updatedAt: true },
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    console.error("PATCH /api/seller/orders", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la commande." }, { status: 500 });
  }
}
