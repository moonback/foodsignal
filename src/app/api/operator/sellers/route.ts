import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeOperatorAudit } from "@/lib/operator-audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  const sellers = await prisma.seller.findMany({
    orderBy: [{ isActive: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, businessName: true, description: true, specialties: true,
      address: true, city: true, postalCode: true, isActive: true, createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { products: true } },
    },
  });
  return NextResponse.json({ sellers });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  try {
    const input = z.object({ sellerId: z.string().min(1), isActive: z.boolean() }).parse(await request.json());
    const seller = await prisma.seller.update({
      where: { id: input.sellerId },
      data: { isActive: input.isActive },
      select: { id: true, businessName: true, isActive: true },
    });
    await writeOperatorAudit({
      actorId: user.id,
      action: input.isActive ? "SELLER_ACTIVATED" : "SELLER_SUSPENDED",
      entityType: "SELLER",
      entityId: seller.id,
      details: { businessName: seller.businessName, isActive: seller.isActive },
    });
    return NextResponse.json({ seller });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Action de validation invalide." }, { status: 400 });
    console.error("PATCH /api/operator/sellers", error);
    return NextResponse.json({ error: "Impossible de modifier le statut du professionnel." }, { status: 500 });
  }
}
