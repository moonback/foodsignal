import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  unit: z.string().trim().min(1).max(30),
  description: z.string().trim().max(500).optional(),
  priceEuros: z.number().positive().max(10000),
  isAvailable: z.boolean().default(true),
});

async function getSeller(userId: string) {
  return prisma.seller.findUnique({ where: { userId }, select: { id: true, isActive: true } });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await getSeller(user.id);
  if (!seller) return NextResponse.json({ error: "Profil professionnel introuvable." }, { status: 404 });
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    orderBy: [{ isAvailable: "desc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, unit: true, description: true, priceCents: true, isAvailable: true, updatedAt: true },
  });
  return NextResponse.json({ products, sellerActive: seller.isActive });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await getSeller(user.id);
  if (!seller) return NextResponse.json({ error: "Profil professionnel introuvable." }, { status: 404 });

  try {
    const input = productSchema.parse(await request.json());
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        name: input.name,
        category: input.category,
        unit: input.unit,
        description: input.description || null,
        priceCents: Math.round(input.priceEuros * 100),
        isAvailable: input.isAvailable,
      },
      select: { id: true, name: true, category: true, unit: true, description: true, priceCents: true, isAvailable: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Vérifiez les informations du produit.", details: error.issues }, { status: 400 });
    console.error("POST /api/seller/products", error);
    return NextResponse.json({ error: "Impossible d'enregistrer le produit." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await getSeller(user.id);
  if (!seller) return NextResponse.json({ error: "Profil professionnel introuvable." }, { status: 404 });

  try {
    const input = z.object({ id: z.string().min(1), ...productSchema.partial().shape }).parse(await request.json());
    const existing = await prisma.product.findFirst({ where: { id: input.id, sellerId: seller.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    const product = await prisma.product.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.priceEuros !== undefined ? { priceCents: Math.round(input.priceEuros * 100) } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      },
      select: { id: true, name: true, category: true, unit: true, description: true, priceCents: true, isAvailable: true },
    });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Informations produit invalides.", details: error.issues }, { status: 400 });
    console.error("PATCH /api/seller/products", error);
    return NextResponse.json({ error: "Impossible de modifier le produit." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await getSeller(user.id);
  if (!seller) return NextResponse.json({ error: "Profil professionnel introuvable." }, { status: 404 });
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(await request.json());
    const existing = await prisma.product.findFirst({ where: { id, sellerId: seller.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Identifiant produit invalide." }, { status: 400 });
    console.error("DELETE /api/seller/products", error);
    return NextResponse.json({ error: "Impossible de supprimer le produit." }, { status: 500 });
  }
}
