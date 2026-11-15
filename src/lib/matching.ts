const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Fruits et légumes": ["fruit", "legume", "légume", "tomate", "carotte", "pomme", "salade", "panier", "bio", "saison", "courgette", "pomme de terre"],
  "Boucherie": ["viande", "boeuf", "bœuf", "porc", "agneau", "poulet", "volaille", "steak", "saucisse", "barbecue"],
  "Poissonnerie": ["poisson", "saumon", "truite", "crevette", "moule", "fruits de mer"],
  "Boulangerie": ["pain", "baguette", "viennoiserie", "croissant", "brioche"],
  "Fromagerie": ["fromage", "lait", "yaourt", "beurre", "crème", "creme"],
  "Épicerie": ["pate", "pâtes", "riz", "huile", "farine", "conserve", "épice", "epice"],
  "Produits fermiers": ["fermier", "ferme", "oeuf", "œuf", "miel", "confiture"],
  "Traiteur": ["traiteur", "plat prepare", "plat préparé", "buffet", "repas"],
  "Boissons": ["jus", "eau", "boisson", "sirop"],
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

export function inferDemandCategories(text: string): string[] {
  const normalized = normalize(text);
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => normalized.includes(normalize(keyword))))
    .map(([category]) => category);
}

export function matchingSpecialties(demandCategories: string[], sellerSpecialties: string[]) {
  const sellerSet = new Set(sellerSpecialties.map(normalize));
  return demandCategories.filter(category => sellerSet.has(normalize(category)));
}
