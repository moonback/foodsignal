const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Fruits et légumes": ["fruit", "legume", "tomate", "carotte", "pomme", "salade", "panier", "bio", "saison", "courgette", "pomme de terre"],
  "Boucherie": ["viande", "boeuf", "porc", "agneau", "poulet", "volaille", "steak", "saucisse", "barbecue"],
  "Poissonnerie": ["poisson", "saumon", "truite", "crevette", "moule", "fruits de mer"],
  "Boulangerie": ["pain", "baguette", "viennoiserie", "croissant", "brioche"],
  "Fromagerie": ["fromage", "lait", "yaourt", "beurre", "creme"],
  "Épicerie": ["pate", "riz", "huile", "farine", "conserve", "epice"],
  "Produits fermiers": ["fermier", "ferme", "oeuf", "miel", "confiture"],
  "Traiteur": ["traiteur", "plat prepare", "buffet", "repas"],
  "Boissons": ["jus", "eau", "boisson", "sirop"],
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

function containsKeyword(text: string, keyword: string) {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
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
  const sellerSet = new Set(sellerSpecialties.map(normalize));
  return demandCategories.filter(category => sellerSet.has(normalize(category)));
}
