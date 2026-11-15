import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { analyzeFoodIntent, anonymizeDemandText, serializeIntent } from "@/lib/ai-intent";
import { prisma } from "@/lib/prisma";

const demandSchema = z.object({
  description: z.string().trim().min(20, "Décrivez votre besoin en au moins 20 caractères.").max(4000),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(12).optional(),
  budgetEuros: z.number().positive().max(10000).optional(),
  requestedAt: z.string().datetime().optional(),
  fulfillmentMode: z.enum(["PICKUP", "DELIVERY"]).optional(),
});

function mapIntentError(error: unknown) {
  if (!(error instanceof Error)) return null;
  if (error.message === "AI_INTENT_NOT_CONFIGURED") return NextResponse.json({ error: "L'analyse intelligente n'est pas configurée. Ajoutez OPENAI_API_KEY côté serveur avant de déposer une demande." }, { status: 503 });
  if (error.message === "AI_INTENT_RATE_LIMITED") return NextResponse.json({ error: "Le service d'analyse est momentanément saturé. Réessayez dans quelques instants." }, { status: 503 });
  if (error.message.startsWith("AI_INTENT_")) return NextResponse.json({ error: "L'analyse de votre demande a échoué. Votre texte n'a pas été enregistré ; vous pouvez réessayer." }, { status: 502 });
  return null;
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

    const intent = await analyzeFoodIntent(body.description);
    const structuredNeed = {
      ...serializeIntent(intent),
      context: {
        budgetMaxCents: body.budgetEuros ? Math.round(body.budgetEuros * 100) : null,
        requestedAt: body.requestedAt || null,
        fulfillmentMode: body.fulfillmentMode || null,
        city: body.city,
      },
    };
    const demand = await prisma.demand.create({
      data: {
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        rawDescription: body.description,
        anonymizedBrief: anonymizeDemandText(intent.summary),
        structuredNeed,
        city: body.city,
        postalCode: body.postalCode || null,
        budgetMaxCents: body.budgetEuros ? Math.round(body.budgetEuros * 100) : null,
        requestedAt: body.requestedAt ? new Date(body.requestedAt) : null,
        fulfillmentMode: body.fulfillmentMode,
        status: intent.isComplete ? "DRAFT" : "NEEDS_CLARIFICATION",
        clarification: intent.clarificationQuestions.length ? intent.clarificationQuestions.join("\n") : null,
      },
      select: { id: true, status: true, createdAt: true, clarification: true, structuredNeed: true },
    });
    return NextResponse.json({ demand, intent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Vérifiez les informations saisies.", details: error.issues }, { status: 400 });
    const mapped = mapIntentError(error);
    if (mapped) return mapped;
    console.error("POST /api/demands", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la demande pour le moment." }, { status: 500 });
  }
}
