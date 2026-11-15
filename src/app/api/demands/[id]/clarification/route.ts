import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { analyzeFoodIntent, anonymizeDemandText, serializeIntent } from "@/lib/ai-intent";
import { prisma } from "@/lib/prisma";

const schema = z.object({ answer: z.string().trim().min(2).max(1000) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Accès particulier requis." }, { status: 403 });

  try {
    const { id } = await context.params;
    const { answer } = schema.parse(await request.json());
    const existing = await prisma.demand.findFirst({
      where: { id, customerId: user.id },
      select: { id: true, rawDescription: true, status: true, structuredNeed: true },
    });
    if (!existing) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (existing.status !== "NEEDS_CLARIFICATION") return NextResponse.json({ error: "Cette demande n'attend plus de précision." }, { status: 409 });

    const previousNeed = existing.structuredNeed && typeof existing.structuredNeed === "object" && !Array.isArray(existing.structuredNeed)
      ? existing.structuredNeed as Record<string, unknown>
      : {};
    const previousItems = Array.isArray(previousNeed.items) ? previousNeed.items : [];
    const missingItemNames = previousItems.flatMap(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const value = item as Record<string, unknown>;
      if (typeof value.name !== "string" || (value.quantity !== null && value.unit !== null)) return [];
      return [value.name];
    });
    const clarificationContext = missingItemNames.length
      ? "Précision du client pour " + missingItemNames.join(", ") + " : "
      : "Précision du client : ";
    const updatedDescription = existing.rawDescription + "\n" + clarificationContext + answer;
    if (updatedDescription.length > 4000) return NextResponse.json({ error: "La demande et sa précision dépassent la taille autorisée." }, { status: 400 });

    const intent = await analyzeFoodIntent(updatedDescription);
    const structuredNeed = {
      ...serializeIntent(intent),
      ...(previousNeed.context ? { context: previousNeed.context } : {}),
    };
    const demand = await prisma.demand.update({
      where: { id },
      data: {
        rawDescription: updatedDescription,
        anonymizedBrief: anonymizeDemandText(intent.summary),
        structuredNeed,
        status: intent.isComplete ? "DRAFT" : "NEEDS_CLARIFICATION",
        clarification: intent.clarificationQuestions.length ? intent.clarificationQuestions.join("\n") : null,
      },
      select: { id: true, status: true, clarification: true },
    });
    return NextResponse.json({ demand, intent });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Précision invalide." }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("AI_INTENT_")) {
      return NextResponse.json({ error: "Impossible de traiter cette précision pour le moment. Réessayez." }, { status: 503 });
    }
    console.error("POST /api/demands/[id]/clarification", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la demande." }, { status: 500 });
  }
}
