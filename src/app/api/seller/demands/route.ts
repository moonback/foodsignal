import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });

  const seller = await prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true, isActive: true } });
  if (!seller) return NextResponse.json({ error: "Profil professionnel introuvable." }, { status: 404 });
  if (!seller.isActive) return NextResponse.json({ demands: [], sellerActive: false });

  const recipients = await prisma.demandRecipient.findMany({
    where: { sellerId: seller.id, demand: { status: { in: ["COLLECTING_OFFERS", "PROPOSAL_READY"] } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      demand: {
        select: {
          id: true, anonymizedBrief: true, city: true, budgetMaxCents: true,
          requestedAt: true, fulfillmentMode: true, status: true, createdAt: true,
          offers: { where: { sellerId: seller.id }, select: { id: true, subtotalCents: true, status: true } },
        },
      },
    },
  });
  return NextResponse.json({
    sellerActive: true,
    demands: recipients.map(({ demand }) => ({
      id: demand.id, brief: demand.anonymizedBrief, city: demand.city,
      budgetMaxCents: demand.budgetMaxCents, requestedAt: demand.requestedAt,
      fulfillmentMode: demand.fulfillmentMode, status: demand.status,
      createdAt: demand.createdAt, myOffer: demand.offers[0] || null,
    })),
  });
}
