const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "../src/lib/ai-intent.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled.outputText, sourcePath);
const { analyzeFoodIntent } = loaded.exports;

function fakeResponse(content) {
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }) };
}

const originalFetch = global.fetch;
const originalKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
});

test("refuse une extraction sans clé IA configurée", async () => {
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(() => analyzeFoodIntent("Je cherche des pommes pour samedi, merci."), /AI_INTENT_NOT_CONFIGURED/);
});

test("ne complète pas une quantité absente et demande une clarification", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => fakeResponse({
    summary: "Des pommes pour une commande.",
    items: [{ name: "Pommes", quantity: null, unit: null, category: "Fruits et légumes", quantityEvidence: null }],
    dietaryConstraints: [],
    preferences: [],
    clarificationQuestions: [],
  });
  const intent = await analyzeFoodIntent("Je voudrais des pommes.");
  assert.equal(intent.items[0].quantity, null);
  assert.equal(intent.isComplete, false);
  assert.ok(intent.clarificationQuestions.some(question => question.includes("quantité")));
});

test("demande l'unité quand une quantité existe mais n'est pas qualifiée", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => fakeResponse({
    summary: "Deux pains.",
    items: [{ name: "Pain", quantity: 2, unit: null, category: "Boulangerie", quantityEvidence: "2 pains" }],
    dietaryConstraints: [],
    preferences: [],
    clarificationQuestions: [],
  });
  const intent = await analyzeFoodIntent("Je voudrais 2 pains.");
  assert.equal(intent.items[0].quantity, 2);
  assert.equal(intent.isComplete, false);
  assert.ok(intent.clarificationQuestions.some(question => question.includes("unité")));
});

test("accepte une demande dont les quantités et unités sont explicitement structurées", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => fakeResponse({
    summary: "Deux kilogrammes de pommes.",
    items: [{ name: "Pommes", quantity: 2, unit: "kg", category: "Fruits et légumes", quantityEvidence: "2 kg de pommes" }],
    dietaryConstraints: [],
    preferences: [],
    clarificationQuestions: [],
  });
  const intent = await analyzeFoodIntent("Je voudrais 2 kg de pommes.");
  assert.equal(intent.isComplete, true);
  assert.equal(intent.items[0].quantity, 2);
  assert.equal(intent.items[0].unit, "kg");
});

test("rejette une quantité attribuée aux convives plutôt qu'au produit", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => fakeResponse({
    summary: "Des pommes pour quatre personnes.",
    items: [{ name: "Pommes", quantity: 4, unit: "pièce", category: "Fruits et légumes", quantityEvidence: "pour 4 personnes" }],
    dietaryConstraints: [],
    preferences: [],
    clarificationQuestions: [],
  });
  const intent = await analyzeFoodIntent("Je voudrais des pommes pour 4 personnes.");
  assert.equal(intent.items[0].quantity, null);
  assert.equal(intent.items[0].unit, null);
  assert.equal(intent.isComplete, false);
});
