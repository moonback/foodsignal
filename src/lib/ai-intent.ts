import { z } from "zod";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().max(10000).nullable(),
  unit: z.string().trim().min(1).max(40).nullable(),
  category: z.string().trim().min(1).max(80).nullable(),
  quantityEvidence: z.string().trim().max(160).nullable(),
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

function normalizeEvidence(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

const frenchNumbers: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12, quinze: 15,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, cent: 100,
};

function quantityHasVerifiableEvidence(item: IntentItem, description: string) {
  const evidence = item.quantityEvidence;
  if (!evidence || !description.includes(evidence)) return false;
  if (/\b(personnes?|convives?|invites?)\b/i.test(evidence)) return false;
  const normalized = normalizeEvidence(evidence);
  const numeric = normalized.match(/\d+(?:[,.]\d+)?/);
  const word = normalized.match(/\b(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|quinze|vingt|trente|quarante|cinquante|cent)\b/);
  const evidencedQuantity = numeric ? Number(numeric[0].replace(",", ".")) : word ? frenchNumbers[word[0]] : null;
  if (evidencedQuantity === null || Math.abs(evidencedQuantity - item.quantity!) > 0.0001) return false;
  const itemTokens = normalizeEvidence(item.name).match(/[a-z0-9]+/g) || [];
  const evidenceTokens = normalized.match(/[a-z0-9]+/g) || [];
  return itemTokens.some(token => evidenceTokens.some(candidate => candidate === token || candidate.startsWith(token) || token.startsWith(candidate)));
}

function unitHasVerifiableEvidence(item: IntentItem) {
  if (!item.unit || !item.quantityEvidence) return false;
  const evidenceTokens = normalizeEvidence(item.quantityEvidence).match(/[a-z0-9]+/g) || [];
  const unit = normalizeEvidence(item.unit);
  const aliases: Record<string, string[]> = {
    kg: ["kg", "kilo", "kilos", "kilogramme", "kilogrammes"],
    g: ["g", "gramme", "grammes"],
    l: ["l", "litre", "litres"],
    ml: ["ml", "millilitre", "millilitres"],
    piece: ["piece", "pieces", "unite", "unites"],
    botte: ["botte", "bottes"],
    barquette: ["barquette", "barquettes"],
    bouteille: ["bouteille", "bouteilles"],
    sachet: ["sachet", "sachets"],
    boite: ["boite", "boites"],
  };
  return (aliases[unit] || [unit]).some(candidate => evidenceTokens.includes(candidate));
}

function getClarifications(output: z.infer<typeof modelOutputSchema>) {
  const missing: string[] = [];
  const questions = [...output.clarificationQuestions];
  if (output.items.length === 0) {
    missing.push("items");
    questions.unshift("Quels produits alimentaires souhaitez-vous acheter ?");
  }
  output.items.forEach((item, index) => {
    if (item.quantity === null) {
      missing.push("items[" + index + "].quantity");
      questions.push("Quelle quantité souhaitez-vous pour « " + item.name + " » (et dans quelle unité : kg, pièce, litre…) ?");
    } else if (item.unit === null) {
      missing.push("items[" + index + "].unit");
      questions.push("Dans quelle unité souhaitez-vous « " + item.name + " » (kg, pièce, litre…) ?");
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
      Authorization: "Bearer " + apiKey,
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
            "Chaque item contient name, quantity, unit, category, quantityEvidence et notes. quantity, unit et quantityEvidence peuvent être null.",
            "quantityEvidence doit être une citation exacte et courte du texte utilisateur contenant explicitement la quantité ET le produit concerné. Si aucune preuve exacte n'existe, quantity doit être null et quantityEvidence null.",
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
  output.items = output.items.map(item => {
    if (item.quantity === null) return item;
    if (!quantityHasVerifiableEvidence(item, description)) {
      return { ...item, quantity: null, unit: null, quantityEvidence: null };
    }
    if (item.unit !== null && !unitHasVerifiableEvidence(item)) return { ...item, unit: null };
    return item;
  });
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
