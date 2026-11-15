import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const demandSchema = z.object({
  description: z.string().trim().min(20, "Décrivez votre besoin en au moins 20 caractères.").max(4000),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(12).optional(),
  budgetEuros: z.number().positive().max(10000).optional(),
  requestedAt: z.string().datetime().optional(),
  fulfillmentMode: z.enum(["PICKUP", "DELIVERY"]).optional(),
  customerEmail: z.string().trim().email(),
  customerName: z.string().trim().min(2).max(100),
});

function anonymize(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[coordonnée masquée]")
    .replace(/(?:\+?33|0)[1-9](?:[ .-]?\d{2}){4}/g, "[téléphone masqué]")
    .replace(/\b\d{1,4}\s+(?:rue|avenue|boulevard|chemin|impasse|place)\s+[^,;.]+/gi, "[adresse masquée]");
}

export async function POST(request: Request) {
  try {
    const body = demandSchema.parse(await request.json());
    const user = await prisma.user.upsert({
      where: { email: body.customerEmail.toLowerCase() },
      update: { name: body.customerName },
      create: { email: body.customerEmail.toLowerCase(), name: body.customerName, passwordHash: "!pilot-invitation-required" },
    });
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Ce compte ne peut pas créer de demande client." }, { status: 403 });
    }
    const demand = await prisma.demand.create({
      data: {
        customerId: user.id,
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
