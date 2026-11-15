import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const demandSchema = z.object({
  description: z.string().trim().min(20, "Décrivez votre besoin en au moins 20 caractères.").max(4000),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(12).optional(),
  budgetEuros: z.number().positive().max(10000).optional(),
  requestedAt: z.string().datetime().optional(),
  fulfillmentMode: z.enum(["PICKUP", "DELIVERY"]).optional(),
});

function anonymize(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[coordonnée masquée]")
    .replace(/(?:\+?33|0)[1-9](?:[ .-]?\d{2}){4}/g, "[téléphone masqué]")
    .replace(/\b\d{1,4}\s+(?:rue|avenue|boulevard|chemin|impasse|place)\s+[^,;.]+/gi, "[adresse masquée]");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour enregistrer une demande." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Seuls les comptes particuliers peuvent créer une demande." }, { status: 403 });

  try {
    const body = demandSchema.parse(await request.json());
    const pilotCity = process.env.PILOT_CITY?.trim();
    if (pilotCity && body.city.localeCompare(pilotCity, "fr", { sensitivity: "base" }) !== 0) {
      return NextResponse.json({ error: `Le pilote est actuellement limité à ${pilotCity}.` }, { status: 400 });
    }
    const demand = await prisma.demand.create({
      data: {
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        rawDescription: body.description,
        anonymizedBrief: anonymize(body.description),
        city: body.city,
        postalCode: body.postalCode || null,
        budgetMaxCents: body.budgetEuros ? Math.round(body.budgetEuros * 100) : null,
        requestedAt: body.requestedAt ? new Date(body.requestedAt) : null,
        fulfillmentMode: body.fulfillmentMode,
        status: "DRAFT",
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({ demand }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Vérifiez les informations saisies.", details: error.issues }, { status: 400 });
    console.error("POST /api/demands", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la demande pour le moment." }, { status: 500 });
  }
}
