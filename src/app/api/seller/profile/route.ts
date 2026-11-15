import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  businessName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  specialties: z.array(z.string().trim().min(2).max(60)).min(1).max(12),
  address: z.string().trim().min(5).max(180),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(4).max(12),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await prisma.seller.findUnique({
    where: { userId: user.id },
    select: { id: true, businessName: true, description: true, specialties: true, address: true, city: true, postalCode: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ seller });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous avant de créer votre profil professionnel." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Ce compte possède déjà un statut professionnel ou opérateur." }, { status: 403 });

  try {
    const input = schema.parse(await request.json());
    const pilotCity = process.env.PILOT_CITY?.trim();
    if (pilotCity && input.city.localeCompare(pilotCity, "fr", { sensitivity: "base" }) !== 0) {
      return NextResponse.json({ error: `Les inscriptions professionnelles sont limitées à ${pilotCity} pendant le pilote.` }, { status: 400 });
    }

    const seller = await prisma.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: {
          userId: user.id,
          businessName: input.businessName,
          description: input.description || null,
          specialties: [...new Set(input.specialties)],
          address: input.address,
          city: input.city,
          postalCode: input.postalCode,
          isActive: false,
        },
        select: { id: true, businessName: true, city: true, isActive: true },
      });
      await tx.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
      return created;
    });

    await createSession({ ...user, role: "SELLER" });
    return NextResponse.json({ seller, message: "Profil créé. Il sera activé après vérification." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Vérifiez les informations du commerce.", details: error.issues }, { status: 400 });
    console.error("POST /api/seller/profile", error);
    return NextResponse.json({ error: "Impossible de créer le profil professionnel." }, { status: 500 });
  }
}
