import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { inferDemandCategories, rankSellerMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

const demandSelect = {
  id: true, status: true, city: true, anonymizedBrief: true,
  budgetMaxCents: true, requestedAt: true, fulfillmentMode: true, createdAt: true,
} as const;

async function getRankedCandidates(demand: {
  id: string; city: string; anonymizedBrief: string;
  budgetMaxCents: number | null; fulfillmentMode: "PICKUP" | "DELIVERY" | null;
}) {
  const categories = inferDemandCategories(demand.anonymizedBrief);
  const sellers = await prisma.seller.findMany({
    where: { isActive: true, city: { equals: demand.city, mode: "insensitive" } },
    select: {
      id: true, specialties: true,
      products: { where: { isAvailable: true }, select: { name: true, category: true, priceCents: true, isAvailable: true } },
    },
  });
  const matches = rankSellerMatches(sellers, {
    categories, brief: demand.anonymizedBrief,
    budgetMaxCents: demand.budgetMaxCents, fulfillmentMode: demand.fulfillmentMode,
  });
  return { categories, matches };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  const demands = await prisma.demand.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
    select: demandSelect,
  });
  const enriched = await Promise.all(demands.map(async demand => {
    const { categories, matches } = await getRankedCandidates(demand);
    return {
      ...demand,
      suggestedCategories: categories,
      candidateCount: matches.length,
      topMatches: matches.slice(0, 5).map(match => ({
        score: match.score, reasons: match.reasons, matchedCategories: match.matchedCategories,
      })),
    };
  }));
  return NextResponse.json({ demands: enriched });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  try {
    const { demandId } = z.object({ demandId: z.string().min(1) }).parse(await request.json());
    const demand = await prisma.demand.findUnique({ where: { id: demandId }, select: demandSelect });
    if (!demand) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (demand.status !== "DRAFT") return NextResponse.json({ error: "Cette demande n'est plus en brouillon." }, { status: 409 });

    const { categories, matches } = await getRankedCandidates(demand);
    if (categories.length === 0) {
      return NextResponse.json({ error: "Aucune catégorie alimentaire reconnue. Clarification manuelle nécessaire." }, { status: 422 });
    }
    if (matches.length === 0) {
      return NextResponse.json({ error: "Aucun commerçant suffisamment pertinent dans cette ville.", categories }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.demandRecipient.createMany({
        data: matches.map(match => ({ demandId, sellerId: match.sellerId })),
        skipDuplicates: true,
      }),
      prisma.demand.update({ where: { id: demandId }, data: { status: "COLLECTING_OFFERS" } }),
    ]);
    return NextResponse.json({
      published: true, matchedSellers: matches.length, categories,
      matches: matches.map(match => ({ score: match.score, reasons: match.reasons, matchedCategories: match.matchedCategories })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Identifiant de demande invalide." }, { status: 400 });
    console.error("POST /api/operator/demands", error);
    return NextResponse.json({ error: "Impossible de diffuser cette demande." }, { status: 500 });
  }
}
