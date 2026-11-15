import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { inferDemandCategories, matchingSpecialties } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  const demands = await prisma.demand.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
    select: { id: true, anonymizedBrief: true, city: true, budgetMaxCents: true, requestedAt: true, fulfillmentMode: true, createdAt: true },
  });
  return NextResponse.json({ demands: demands.map(demand => ({ ...demand, suggestedCategories: inferDemandCategories(demand.anonymizedBrief) })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  try {
    const { demandId } = z.object({ demandId: z.string().min(1) }).parse(await request.json());
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      select: { id: true, status: true, city: true, anonymizedBrief: true },
    });
    if (!demand) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (demand.status !== "DRAFT") return NextResponse.json({ error: "Cette demande n'est plus en brouillon." }, { status: 409 });

    const categories = inferDemandCategories(demand.anonymizedBrief);
    if (categories.length === 0) return NextResponse.json({ error: "Aucune spécialité ne peut être déduite avec assez de confiance. La demande doit être clarifiée manuellement." }, { status: 422 });

    const sellers = await prisma.seller.findMany({
      where: { isActive: true, city: { equals: demand.city, mode: "insensitive" } },
      select: { id: true, specialties: true },
    });
    const matched = sellers.filter(seller => matchingSpecialties(categories, seller.specialties).length > 0);
    if (matched.length === 0) return NextResponse.json({ error: "Aucun commerçant actif correspondant dans cette ville.", categories }, { status: 409 });

    await prisma.$transaction([
      prisma.demandRecipient.createMany({
        data: matched.map(seller => ({ demandId, sellerId: seller.id })),
        skipDuplicates: true,
      }),
      prisma.demand.update({ where: { id: demandId }, data: { status: "COLLECTING_OFFERS" } }),
    ]);
    return NextResponse.json({ published: true, matchedSellers: matched.length, categories });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Identifiant de demande invalide." }, { status: 400 });
    console.error("POST /api/operator/demands", error);
    return NextResponse.json({ error: "Impossible de diffuser cette demande." }, { status: 500 });
  }
}
