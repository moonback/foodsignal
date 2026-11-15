const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "../src/lib/matching.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const matchingModule = new Module(sourcePath, module);
matchingModule.filename = sourcePath;
matchingModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
matchingModule._compile(compiled.outputText, sourcePath);

const {
  normalizeMatchingText,
  inferDemandCategories,
  scoreSellerMatch,
  rankSellerMatches,
} = matchingModule.exports;

const demand = {
  categories: ["Fruits et légumes", "Boulangerie"],
  brief: "Je cherche des légumes bio et du pain pour samedi.",
  budgetMaxCents: 3000,
  fulfillmentMode: "PICKUP",
};

function seller(id, overrides = {}) {
  return {
    id,
    specialties: ["Fruits et légumes", "Boulangerie"],
    products: [
      { name: "Panier de légumes bio", category: "Fruits et légumes", priceCents: 2500, isAvailable: true },
      { name: "Pain de campagne", category: "Boulangerie", priceCents: 500, isAvailable: true },
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

test("attribue un score élevé à un vendeur dont spécialités et catalogue correspondent", () => {
  const result = scoreSellerMatch(seller("seller-a"), demand);
  assert.equal(result.score, 100);
  assert.deepEqual(result.matchedCategories, ["Fruits et légumes", "Boulangerie"]);
  assert.equal(result.availableProducts, 2);
});

test("exclut les produits indisponibles du score catalogue", () => {
  const result = scoreSellerMatch(seller("seller-b", {
    specialties: [],
    products: [{ name: "Panier de légumes", category: "Fruits et légumes", priceCents: 1000, isAvailable: false }],
  }), demand);
  assert.equal(result.availableProducts, 0);
  assert.equal(result.matchedCategories.length, 0);
});

test("n'accorde pas le signal budget si aucun produit pertinent n'est sous le budget", () => {
  const result = scoreSellerMatch(seller("seller-c", {
    products: [{ name: "Panier de légumes", category: "Fruits et légumes", priceCents: 5000, isAvailable: true }],
  }), { ...demand, categories: ["Fruits et légumes"] });
  assert.equal(result.reasons.some(reason => reason.includes("Aucun produit pertinent")), true);
  assert.equal(result.score, 50 + 35);
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
