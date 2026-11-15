import { z } from "zod";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().max(10000).nullable(),
  unit: z.string().trim().min(1).max(40).nullable(),
  category: z.string().trim().min(1).max(80).nullable(),
  notes: z.string().trim().max(240).nullable().optional(),
});

const modelOutputSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  items: z.array(itemSchema).max(30),
  dietaryConstraints: z.array(z.string().trim().min(1).max(120)).max(20),
  preferences: z.array(z.string().trim().min(1).max(120)).max(20),
  clarificationQuestions: z.array(z.string().trim().min(1).max(300)).max(8),
});

export type IntentItem = z.infer<typeof itemSchema>;
export type AnalyzedIntent = z.infer<typeof modelOutputSchema> & {
  isComplete: boolean;
  missingFields: string[];
};

function getClarifications(output: z.infer<typeof modelOutputSchema>) {
  const missing: string[] = [];
  const questions = [...output.clarificationQuestions];
  if (output.items.length === 0) {
    missing.push("items");
    questions.unshift("Quels produits alimentaires souhaitez-vous acheter ?");
  }
  output.items.forEach((item, index) => {
    if (item.quantity === null) {
      missing.push(`items[${index}].quantity`);
      questions.push(`Quelle quantité souhaitez-vous pour « ${item.name} » (et dans quelle unité : kg, pièce, litre…) ?`);
    }
  });
  return {
    missingFields: [...new Set(missing)],
    clarificationQuestions: [...new Set(questions)].slice(0, 8),
  };
}

export async function analyzeFoodIntent(description: string): Promise<AnalyzedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI_INTENT_NOT_CONFIGURED");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Tu es le moteur d'extraction des demandes alimentaires de FOOD SIGNAL.",
            "Retourne uniquement un objet JSON avec summary, items, dietaryConstraints, preferences et clarificationQuestions.",
            "Chaque item contient name, quantity, unit, category et notes. quantity et unit peuvent être null.",
            "RÈGLE ABSOLUE : ne déduis jamais une quantité, un poids, un nombre de pièces ou une unité qui n'est pas explicitement donné.",
            "Un nombre de convives n'est PAS une quantité de produits. Ne convertis jamais « pour 4 personnes » en 4 unités ou en grammes.",
            "Si la quantité manque, conserve quantity:null et pose une question claire. Si l'unité manque pour une quantité, conserve unit:null et demande l'unité.",
            "N'invente aucun produit. Ne transforme pas une préférence en contrainte ferme. Préserve les termes du client.",
            "summary doit être un résumé neutre et court, sans coordonnées personnelles.",
            "Les questions portent uniquement sur les informations nécessaires pour obtenir une demande exploitable.",
            "Utilise une catégorie alimentaire française simple lorsque c'est évident, sinon null.",
          ].join(" "),
        },
        { role: "user", content: description },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("AI Intent provider error", response.status, detail.slice(0, 1000));
    throw new Error(response.status === 429 ? "AI_INTENT_RATE_LIMITED" : "AI_INTENT_PROVIDER_ERROR");
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI_INTENT_INVALID_RESPONSE");

  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error("AI_INTENT_INVALID_RESPONSE"); }
  const output = modelOutputSchema.parse(parsed);
  const clarification = getClarifications(output);
  return {
    ...output,
    ...clarification,
    isComplete: clarification.missingFields.length === 0 && clarification.clarificationQuestions.length === 0,
  };
}

export function serializeIntent(intent: AnalyzedIntent) {
  return {
    version: 1,
    source: "openai",
    summary: intent.summary,
    items: intent.items,
    dietaryConstraints: intent.dietaryConstraints,
    preferences: intent.preferences,
    missingFields: intent.missingFields,
    clarificationQuestions: intent.clarificationQuestions,
  };
}

export function anonymizeDemandText(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[coordonnée masquée]")
    .replace(/(?:\+?33|0)[1-9](?:[ .-]?\d{2}){4}/g, "[téléphone masqué]")
    .replace(/\b\d{1,4}\s+(?:rue|avenue|boulevard|chemin|impasse|place)\s+[^,;.]+/gi, "[adresse masquée]");
}
