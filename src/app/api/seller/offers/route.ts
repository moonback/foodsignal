import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  demandId: z.string().min(1),
  items: z.array(z.object({
    name: z.string().trim().min(2).max(120),
    quantity: z.number().int().min(1).max(10000),
    unit: z.string().trim().min(1).max(30),
    unitPriceCents: z.number().int().min(1).max(10000000),
  })).min(1).max(30),
  preparationCents: z.number().int().min(0).max(1000000).default(0),
  deliveryCents: z.number().int().min(0).max(1000000).default(0),
  notes: z.string().trim().max(1000).optional(),
  fulfillmentModes: z.array(z.enum(["PICKUP", "DELIVERY"])).min(1).max(2),
  availableAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });

  try {
    const input = schema.parse(await request.json());
    const seller = await prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true, isActive: true } });
    if (!seller || !seller.isActive) return NextResponse.json({ error: "Votre établissement doit être validé avant de répondre." }, { status: 403 });

    const recipient = await prisma.demandRecipient.findFirst({
      where: { demandId: input.demandId, sellerId: seller.id, demand: { status: "COLLECTING_OFFERS" } },
      select: { id: true },
    });
    if (!recipient) return NextResponse.json({ error: "Cette demande ne vous a pas été attribuée ou n'accepte plus de propositions." }, { status: 404 });

    const subtotalCents = input.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
    if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 100000000) return NextResponse.json({ error: "Le montant total de l'offre dépasse la limite autorisée." }, { status: 400 });
    const data = {
      items: input.items as unknown as Prisma.InputJsonValue,
      subtotalCents,
      preparationCents: input.preparationCents,
      deliveryCents: input.deliveryCents,
      notes: input.notes || null,
      fulfillmentModes: [...new Set(input.fulfillmentModes)],
      availableAt: input.availableAt ? new Date(input.availableAt) : null,
      status: "SUBMITTED" as const,
    };
    const offer = await prisma.offer.upsert({
      where: { demandId_sellerId: { demandId: input.demandId, sellerId: seller.id } },
      create: { demandId: input.demandId, sellerId: seller.id, ...data },
      update: data,
      select: { id: true, subtotalCents: true, preparationCents: true, deliveryCents: true, status: true, createdAt: true },
    });
    const [recipientCount, offerCount] = await Promise.all([
      prisma.demandRecipient.count({ where: { demandId: input.demandId } }),
      prisma.offer.count({ where: { demandId: input.demandId, status: "SUBMITTED" } }),
    ]);
    if (recipientCount > 0 && offerCount >= recipientCount) {
      await prisma.demand.update({ where: { id: input.demandId }, data: { status: "PROPOSAL_READY" } });
    }
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Vérifiez les lignes et conditions de votre proposition.", details: error.issues }, { status: 400 });
    console.error("POST /api/seller/offers", error);
    return NextResponse.json({ error: "Impossible d'enregistrer votre proposition." }, { status: 500 });
  }
}
