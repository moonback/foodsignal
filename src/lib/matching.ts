const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Fruits et légumes": ["fruit", "legume", "tomate", "carotte", "pomme", "salade", "panier", "bio", "saison", "courgette", "pomme de terre", "oignon", "poireau"],
  "Boucherie": ["viande", "boeuf", "porc", "agneau", "poulet", "volaille", "steak", "saucisse", "barbecue", "veau", "dinde"],
  "Poissonnerie": ["poisson", "saumon", "truite", "crevette", "moule", "fruits de mer", "cabillaud"],
  "Boulangerie": ["pain", "baguette", "viennoiserie", "croissant", "brioche", "farine"],
  "Fromagerie": ["fromage", "lait", "yaourt", "beurre", "creme", "comte"],
  "Épicerie": ["pate", "riz", "huile", "farine", "conserve", "epice", "lentille", "semoule"],
  "Produits fermiers": ["fermier", "ferme", "oeuf", "miel", "confiture", "producteur"],
  "Traiteur": ["traiteur", "plat prepare", "buffet", "repas", "cuisine"],
  "Boissons": ["jus", "eau", "boisson", "sirop", "limonade"],
};

export function normalizeMatchingText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

function containsKeyword(text: string, keyword: string) {
  const normalizedText = normalizeMatchingText(text);
  const normalizedKeyword = normalizeMatchingText(keyword);
  if (normalizedKeyword.includes(" ")) return normalizedText.includes(normalizedKeyword);
  const tokens = normalizedText.match(/[a-z0-9]+/g) || [];
  return tokens.some(token => token === normalizedKeyword || token.startsWith(normalizedKeyword));
}

export function inferDemandCategories(text: string): string[] {
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => containsKeyword(text, keyword)))
    .map(([category]) => category);
}

export function matchingSpecialties(demandCategories: string[], sellerSpecialties: string[]) {
  const sellerSet = new Set(sellerSpecialties.map(normalizeMatchingText));
  return demandCategories.filter(category => sellerSet.has(normalizeMatchingText(category)));
}

export type MatchingSeller = {
  id: string;
  specialties: string[];
  products: Array<{ name: string; category: string; priceCents: number; isAvailable: boolean }>;
};

export type MatchingConstraints = {
  categories: string[];
  brief: string;
  budgetMaxCents: number | null;
  fulfillmentMode: "PICKUP" | "DELIVERY" | null;
};

export type SellerMatch = {
  sellerId: string;
  score: number;
  reasons: string[];
  matchedCategories: string[];
  availableProducts: number;
};

export function scoreSellerMatch(seller: MatchingSeller, demand: MatchingConstraints): SellerMatch {
  const availableProducts = seller.products.filter(product => product.isAvailable);
  const specialtyMatches = matchingSpecialties(demand.categories, seller.specialties);
  const productMatches = demand.categories.filter(category =>
    availableProducts.some(product =>
      normalizeMatchingText(product.category) === normalizeMatchingText(category)
      || CATEGORY_KEYWORDS[category]?.some(keyword =>
        containsKeyword(product.name + " " + product.category, keyword),
      ),
    ),
  );
  const briefKeywords = demand.brief.split(/[^\p{L}\p{N}]+/u).filter(token => token.length >= 4).map(normalizeMatchingText);
  const productKeywordHits = briefKeywords.filter(keyword =>
    availableProducts.some(product => containsKeyword(product.name + " " + product.category, keyword)),
  );
  const specialtyPoints = demand.categories.length
    ? Math.round(50 * specialtyMatches.length / demand.categories.length)
    : 0;
  const productPoints = demand.categories.length
    ? Math.round(35 * productMatches.length / demand.categories.length)
    : Math.min(35, productKeywordHits.length * 5);
  const relevantProducts = availableProducts.filter(product =>
    demand.categories.some(category =>
      normalizeMatchingText(product.category) === normalizeMatchingText(category)
      || CATEGORY_KEYWORDS[category]?.some(keyword => containsKeyword(product.name + " " + product.category, keyword)),
    ),
  );
  const budgetPoints = demand.budgetMaxCents == null
    ? 15
    : (relevantProducts.some(product => product.priceCents <= demand.budgetMaxCents!) ? 15 : 0);
  const score = Math.min(100, specialtyPoints + productPoints + budgetPoints);
  const reasons: string[] = [];
  if (specialtyMatches.length) reasons.push(`Spécialités : ${specialtyMatches.join(", ")}`);
  if (productMatches.length) reasons.push(`Catalogue : ${productMatches.join(", ")}`);
  if (productKeywordHits.length && !productMatches.length) reasons.push("Produits du catalogue proches des termes de la demande");
  if (demand.budgetMaxCents != null) reasons.push("Présence d'un produit pertinent sous le budget (indication, pas un devis complet)");
  if (!reasons.length) reasons.push("Correspondance faible : vérification opérateur recommandée");
  return {
    sellerId: seller.id,
    score,
    reasons,
    matchedCategories: [...new Set([...specialtyMatches, ...productMatches])],
    availableProducts: availableProducts.length,
  };
}

export function rankSellerMatches(sellers: MatchingSeller[], demand: MatchingConstraints): SellerMatch[] {
  return sellers
    .map(seller => scoreSellerMatch(seller, demand))
    .filter(match => match.score >= 25)
    .sort((a, b) => b.score - a.score || a.sellerId.localeCompare(b.sellerId))
    .slice(0, 10);
}
