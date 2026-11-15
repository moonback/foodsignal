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

export type MatchingRequestedItem = {
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
};

export type MatchingSeller = {
  id: string;
  specialties: string[];
  products: Array<{ name: string; category: string; unit?: string; priceCents: number; isAvailable: boolean }>;
};

export type MatchingConstraints = {
  categories: string[];
  brief: string;
  budgetMaxCents: number | null;
  fulfillmentMode: "PICKUP" | "DELIVERY" | null;
  requestedItems?: MatchingRequestedItem[];
};

export type SellerMatch = {
  sellerId: string;
  score: number;
  reasons: string[];
  matchedCategories: string[];
  availableProducts: number;
  estimatedBasketCents: number | null;
};

export type BasketPlan = {
  sellerIds: string[];
  estimatedSubtotalCents: number;
  allocations: Array<{
    requestedItem: MatchingRequestedItem;
    sellerId: string;
    productName: string;
    quantity: number;
    unit: string | null;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
  sellerSubtotals: Array<{ sellerId: string; subtotalCents: number }>;
};

function unitsMatch(requestedUnit?: string, productUnit?: string) {
  if (!requestedUnit) return true;
  if (!productUnit) return false;
  return normalizeMatchingText(requestedUnit) === normalizeMatchingText(productUnit);
}

function productMatchesRequestedItem(
  product: MatchingSeller["products"][number],
  item: MatchingRequestedItem,
) {
  if (!product.isAvailable || !unitsMatch(item.unit, product.unit)) return false;
  const productName = normalizeMatchingText(product.name);
  const itemName = normalizeMatchingText(item.name);
  const productTokens = productName.match(/[a-z0-9]+/g) || [];
  const itemTokens = itemName.match(/[a-z0-9]+/g) || [];
  const nameMatches = itemTokens.length > 0 && itemTokens.every(token =>
    productTokens.some(productToken =>
      productToken === token || productToken.startsWith(token) || token.startsWith(productToken),
    ),
  );
  const categoryMatches = !item.category
    || normalizeMatchingText(product.category) === normalizeMatchingText(item.category);
  return nameMatches && categoryMatches;
}

export function parseRequestedItems(value: unknown): MatchingRequestedItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const rawItems = (value as { items?: unknown }).items;
  if (!Array.isArray(rawItems)) return [];
  return rawItems.flatMap((raw): MatchingRequestedItem[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim()
      || typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity)
      || item.quantity < 1 || item.quantity > 10000) return [];
    return [{
      name: item.name.trim(),
      quantity: item.quantity,
      ...(typeof item.unit === "string" && item.unit.trim() ? { unit: item.unit.trim() } : {}),
      ...(typeof item.category === "string" && item.category.trim() ? { category: item.category.trim() } : {}),
    }];
  }).slice(0, 30);
}

export function estimateSellerBasket(
  seller: MatchingSeller,
  requestedItems: MatchingRequestedItem[],
): number | null {
  if (!requestedItems.length) return null;
  let total = 0;
  for (const item of requestedItems) {
    const product = seller.products
      .filter(candidate => productMatchesRequestedItem(candidate, item))
      .sort((a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name, "fr"))[0];
    if (!product) return null;
    const lineTotal = item.quantity * product.priceCents;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(total + lineTotal)) return null;
    total += lineTotal;
  }
  return total;
}

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
  const requestedItems = demand.requestedItems || [];
  const estimatedBasketCents = estimateSellerBasket(seller, requestedItems);
  const budgetPoints = demand.budgetMaxCents == null
    ? 15
    : estimatedBasketCents != null && estimatedBasketCents <= demand.budgetMaxCents ? 15 : 0;
  const score = Math.min(100, specialtyPoints + productPoints + budgetPoints);
  const reasons: string[] = [];
  if (specialtyMatches.length) reasons.push(`Spécialités : ${specialtyMatches.join(", ")}`);
  if (productMatches.length) reasons.push(`Catalogue : ${productMatches.join(", ")}`);
  if (productKeywordHits.length && !productMatches.length) reasons.push("Produits du catalogue proches des termes de la demande");
  if (demand.budgetMaxCents != null && estimatedBasketCents != null && budgetPoints > 0) {
    reasons.push(`Panier estimé à ${(estimatedBasketCents / 100).toFixed(2)} € hors frais, sous le budget`);
  } else if (demand.budgetMaxCents != null && estimatedBasketCents != null) {
    reasons.push(`Panier estimé à ${(estimatedBasketCents / 100).toFixed(2)} € hors frais, au-dessus du budget`);
  } else if (demand.budgetMaxCents != null && requestedItems.length) {
    reasons.push("Panier incomplet : certains articles ou unités ne correspondent pas au catalogue");
  } else if (demand.budgetMaxCents != null) {
    reasons.push("Budget non noté : les quantités et lignes du panier ne sont pas encore structurées");
  }
  if (!reasons.length) reasons.push("Correspondance faible : vérification opérateur recommandée");
  return {
    sellerId: seller.id,
    score,
    reasons,
    matchedCategories: [...new Set([...specialtyMatches, ...productMatches])],
    availableProducts: availableProducts.length,
    estimatedBasketCents,
  };
}

export function rankSellerMatches(sellers: MatchingSeller[], demand: MatchingConstraints): SellerMatch[] {
  return sellers
    .map(seller => scoreSellerMatch(seller, demand))
    .filter(match => match.score >= 25)
    .sort((a, b) => b.score - a.score || a.sellerId.localeCompare(b.sellerId))
    .slice(0, 10);
}

export function planMultiSellerBaskets(
  sellers: MatchingSeller[],
  requestedItems: MatchingRequestedItem[],
  maxSellers = 3,
  maxPlans = 5,
): BasketPlan[] {
  if (!requestedItems.length || !sellers.length || maxSellers < 1) return [];
  const eligible = sellers.filter(seller => seller.products.some(product => product.isAvailable)).slice(0, 10);
  const plans: BasketPlan[] = [];

  const evaluate = (selected: MatchingSeller[]) => {
    const allocations: BasketPlan["allocations"] = [];
    const subtotals = new Map<string, number>();
    for (const item of requestedItems) {
      const options = selected.flatMap(seller => seller.products
        .filter(product => productMatchesRequestedItem(product, item))
        .map(product => ({ seller, product })));
      options.sort((a, b) => a.product.priceCents - b.product.priceCents
        || a.seller.id.localeCompare(b.seller.id)
        || a.product.name.localeCompare(b.product.name, "fr"));
      const choice = options[0];
      if (!choice) return;
      const lineTotalCents = item.quantity * choice.product.priceCents;
      if (!Number.isSafeInteger(lineTotalCents)) return;
      allocations.push({
        requestedItem: item,
        sellerId: choice.seller.id,
        productName: choice.product.name,
        quantity: item.quantity,
        unit: choice.product.unit || item.unit || null,
        unitPriceCents: choice.product.priceCents,
        lineTotalCents,
      });
      subtotals.set(choice.seller.id, (subtotals.get(choice.seller.id) || 0) + lineTotalCents);
    }
    const estimatedSubtotalCents = allocations.reduce((sum, item) => sum + item.lineTotalCents, 0);
    if (!Number.isSafeInteger(estimatedSubtotalCents)) return;
    plans.push({
      sellerIds: [...subtotals.keys()].sort(),
      estimatedSubtotalCents,
      allocations,
      sellerSubtotals: [...subtotals.entries()]
        .map(([sellerId, subtotalCents]) => ({ sellerId, subtotalCents }))
        .sort((a, b) => a.sellerId.localeCompare(b.sellerId)),
    });
  };

  const visit = (start: number, selected: MatchingSeller[]) => {
    if (selected.length) evaluate(selected);
    if (selected.length >= Math.min(maxSellers, eligible.length)) return;
    for (let index = start; index < eligible.length; index++) {
      visit(index + 1, [...selected, eligible[index]]);
    }
  };
  visit(0, []);
  const unique = new Map<string, BasketPlan>();
  for (const plan of plans) {
    const key = plan.sellerIds.join("|");
    const existing = unique.get(key);
    if (!existing || plan.estimatedSubtotalCents < existing.estimatedSubtotalCents) unique.set(key, plan);
  }
  return [...unique.values()]
    .sort((a, b) => a.estimatedSubtotalCents - b.estimatedSubtotalCents
      || a.sellerIds.length - b.sellerIds.length
      || a.sellerIds.join("|").localeCompare(b.sellerIds.join("|")))
    .slice(0, maxPlans);
}
