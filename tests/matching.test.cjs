const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "../src/lib/matching.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const matchingModule = new Module(sourcePath, module);
matchingModule.filename = sourcePath;
matchingModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
matchingModule._compile(compiled.outputText, sourcePath);

const {
  normalizeMatchingText,
  inferDemandCategories,
  parseRequestedItems,
  estimateSellerBasket,
  scoreSellerMatch,
  rankSellerMatches,
  planMultiSellerBaskets,
} = matchingModule.exports;

const demand = {
  categories: ["Fruits et légumes", "Boulangerie"],
  brief: "Je cherche des légumes bio et du pain pour samedi.",
  budgetMaxCents: 3000,
  fulfillmentMode: "PICKUP",
  requestedItems: [
    { name: "Panier de légumes bio", quantity: 1, unit: "pièce" },
    { name: "Pain de campagne", quantity: 1, unit: "pièce" },
  ],
};

function seller(id, overrides = {}) {
  return {
    id,
    specialties: ["Fruits et légumes", "Boulangerie"],
    products: [
      { name: "Panier de légumes bio", category: "Fruits et légumes", unit: "pièce", priceCents: 2500, isAvailable: true },
      { name: "Pain de campagne", category: "Boulangerie", unit: "pièce", priceCents: 500, isAvailable: true },
    ],
    ...overrides,
  };
}

test("normalise les accents, la casse et les espaces", () => {
  assert.equal(normalizeMatchingText("  ÉPICERIE  "), "epicerie");
});

test("détecte plusieurs catégories sans tenir compte des accents", () => {
  assert.deepEqual(
    inferDemandCategories("Je voudrais des tomates, des pommes et du fromage"),
    ["Fruits et légumes", "Fromagerie"],
  );
});

test("ne détecte pas un mot-clé au milieu d'un mot sans rapport", () => {
  assert.deepEqual(inferDemandCategories("Je cherche un cadeau"), []);
});

test("lit uniquement les lignes structurées et ignore les quantités invalides", () => {
  assert.deepEqual(parseRequestedItems({
    items: [
      { name: "Tomates", quantity: 2, unit: "kg" },
      { name: "Pain", quantity: 0 },
      { name: "", quantity: 1 },
      null,
    ],
  }), [{ name: "Tomates", quantity: 2, unit: "kg" }]);
});

test("calcule le coût complet des lignes avec les quantités", () => {
  assert.equal(estimateSellerBasket(seller("seller-a"), demand.requestedItems), 3000);
});

test("ne calcule pas un panier incomplet ni une unité incompatible", () => {
  const incomplete = seller("seller-b", {
    products: [{ name: "Tomates", category: "Fruits et légumes", unit: "kg", priceCents: 400, isAvailable: true }],
  });
  assert.equal(estimateSellerBasket(incomplete, [{ name: "Tomates", quantity: 2, unit: "pièce" }]), null);
  assert.equal(estimateSellerBasket(incomplete, [{ name: "Pain", quantity: 1, unit: "kg" }]), null);
  assert.equal(estimateSellerBasket(seller("missing-unit", {
    products: [{ name: "Tomates", category: "Fruits et légumes", priceCents: 400, isAvailable: true }],
  }), [{ name: "Tomates", quantity: 2, unit: "kg" }]), null);
});

test("attribue un score de 100 si le panier complet est sous le budget", () => {
  const result = scoreSellerMatch(seller("seller-a"), demand);
  assert.equal(result.score, 100);
  assert.equal(result.estimatedBasketCents, 3000);
  assert.deepEqual(result.matchedCategories, ["Fruits et légumes", "Boulangerie"]);
});

test("n'accorde aucun point budget si le panier complet dépasse le budget", () => {
  const result = scoreSellerMatch(seller("seller-c", {
    products: [{ name: "Panier de légumes bio", category: "Fruits et légumes", unit: "pièce", priceCents: 5000, isAvailable: true }],
  }), {
    ...demand,
    categories: ["Fruits et légumes"],
    requestedItems: [{ name: "Panier de légumes bio", quantity: 1, unit: "pièce" }],
  });
  assert.equal(result.estimatedBasketCents, 5000);
  assert.equal(result.reasons.some(reason => reason.includes("au-dessus du budget")), true);
  assert.equal(result.score, 85);
});

test("ne note pas artificiellement le budget si les quantités ne sont pas structurées", () => {
  const result = scoreSellerMatch(seller("seller-no-need"), { ...demand, requestedItems: [] });
  assert.equal(result.estimatedBasketCents, null);
  assert.equal(result.score, 85);
  assert.equal(result.reasons.some(reason => reason.includes("Budget non noté")), true);
});

test("construit une combinaison multi-vendeurs complète et minimise le sous-total", () => {
  const sellers = [
    seller("seller-fruits", {
      specialties: ["Fruits et légumes"],
      products: [{ name: "Tomates", category: "Fruits et légumes", unit: "kg", priceCents: 300, isAvailable: true }],
    }),
    seller("seller-bread", {
      specialties: ["Boulangerie"],
      products: [{ name: "Pain", category: "Boulangerie", unit: "pièce", priceCents: 180, isAvailable: true }],
    }),
    seller("seller-expensive", {
      products: [
        { name: "Tomates", category: "Fruits et légumes", unit: "kg", priceCents: 500, isAvailable: true },
        { name: "Pain", category: "Boulangerie", unit: "pièce", priceCents: 250, isAvailable: true },
      ],
    }),
  ];
  const plans = planMultiSellerBaskets(sellers, [
    { name: "Tomates", quantity: 2, unit: "kg", category: "Fruits et légumes" },
    { name: "Pain", quantity: 1, unit: "pièce", category: "Boulangerie" },
  ], 2, 5);
  assert.ok(plans.length > 0);
  assert.equal(plans[0].estimatedSubtotalCents, 780);
  assert.deepEqual(plans[0].sellerIds, ["seller-bread", "seller-fruits"]);
  assert.equal(plans[0].allocations.length, 2);
});

test("classe par score décroissant puis identifiant et limite à dix vendeurs", () => {
  const sellers = Array.from({ length: 12 }, (_, index) => seller(`seller-${String(index).padStart(2, "0")}`));
  const ranked = rankSellerMatches(sellers, demand);
  assert.equal(ranked.length, 10);
  assert.deepEqual(ranked.map(match => match.sellerId), [
    "seller-00", "seller-01", "seller-02", "seller-03", "seller-04",
    "seller-05", "seller-06", "seller-07", "seller-08", "seller-09",
  ]);
});

test("écarte les vendeurs sous le seuil de 25 points", () => {
  const ranked = rankSellerMatches([
    seller("weak", { specialties: [], products: [] }),
  ], { ...demand, budgetMaxCents: 100 });
  assert.deepEqual(ranked, []);
});

test("accepte les quantités fractionnaires pour les unités au poids", () => {
  const stock = seller("seller-weight", {
    products: [{ name: "Pommes", category: "Fruits et légumes", unit: "kg", priceCents: 300, isAvailable: true }],
  });
  const parsed = parseRequestedItems({ items: [{ name: "Pommes", quantity: 1.5, unit: "kg" }] });
  assert.equal(parsed.length, 1);
  assert.equal(estimateSellerBasket(stock, parsed), 450);
});

test("ne donne pas de points budget sans panier complet même si aucun budget n'est défini", () => {
  const result = scoreSellerMatch(seller("seller-unpriced"), {
    ...demand,
    budgetMaxCents: null,
    requestedItems: [],
  });
  assert.equal(result.estimatedBasketCents, null);
  assert.equal(result.score, 85);
});
