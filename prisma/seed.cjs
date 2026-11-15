// Données de démonstration : 5 commerçants et 20 produits.
// Usage : node prisma/seed.cjs   (idempotent : peut être relancé sans doublons)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo1234!";

const sellers = [
  {
    email: "boulangerie.dupain@example.com",
    name: "Camille Dupain",
    businessName: "Boulangerie Le Pain Doré",
    description: "Boulangerie artisanale, pains au levain et viennoiseries pur beurre.",
    specialties: ["boulangerie", "pâtisserie", "traiteur"],
    address: "12 rue de la République",
    city: "Lyon",
    postalCode: "69002",
    latitude: 45.7578,
    longitude: 4.8320,
    products: [
      { name: "Pain de campagne au levain", category: "Boulangerie", unit: "pièce (800 g)", priceCents: 480, description: "Pain au levain naturel, cuit au four à pierre." },
      { name: "Baguette tradition", category: "Boulangerie", unit: "pièce", priceCents: 130, description: "Farine label rouge, fermentation longue." },
      { name: "Croissant pur beurre", category: "Viennoiserie", unit: "pièce", priceCents: 120, description: "Beurre AOP Charentes-Poitou." },
      { name: "Plateau de mignardises (24 pièces)", category: "Pâtisserie", unit: "plateau", priceCents: 3200, description: "Assortiment pour buffet ou cocktail." },
    ],
  },
  {
    email: "boucherie.martin@example.com",
    name: "Julien Martin",
    businessName: "Boucherie Martin & Fils",
    description: "Viandes locales sélectionnées, charcuterie maison.",
    specialties: ["boucherie", "charcuterie", "barbecue"],
    address: "5 place du Marché",
    city: "Lyon",
    postalCode: "69003",
    latitude: 45.7603,
    longitude: 4.8574,
    products: [
      { name: "Poulet fermier label rouge", category: "Volaille", unit: "kg", priceCents: 1190, description: "Élevé en plein air dans les Monts du Lyonnais." },
      { name: "Côte de bœuf maturée", category: "Boucherie", unit: "kg", priceCents: 3490, description: "Maturation 21 jours, race charolaise." },
      { name: "Saucisses de Toulouse", category: "Charcuterie", unit: "kg", priceCents: 1290, description: "Fabrication maison, sans conservateur." },
      { name: "Brochettes de poulet mariné", category: "Barbecue", unit: "kg", priceCents: 1690, description: "Marinade citron-herbes, prêtes à griller." },
    ],
  },
  {
    email: "primeur.verger@example.com",
    name: "Sofia Benali",
    businessName: "Primeur du Verger",
    description: "Fruits et légumes de saison issus de producteurs de la région.",
    specialties: ["fruits", "légumes", "bio"],
    address: "28 avenue Jean Jaurès",
    city: "Lyon",
    postalCode: "69007",
    latitude: 45.7457,
    longitude: 4.8423,
    products: [
      { name: "Tomates anciennes bio", category: "Légumes", unit: "kg", priceCents: 650, description: "Variétés mélangées, cueillies à maturité." },
      { name: "Pommes Gala", category: "Fruits", unit: "kg", priceCents: 320, description: "Producteur de la vallée du Rhône." },
      { name: "Panier de légumes de saison", category: "Paniers", unit: "panier (5 kg)", priceCents: 1800, description: "6 à 8 légumes variés selon la récolte." },
      { name: "Salade composée fraîche (6 pers.)", category: "Traiteur", unit: "bac", priceCents: 2400, description: "Crudités de saison, vinaigrette à part." },
    ],
  },
  {
    email: "poissonnerie.ocean@example.com",
    name: "Marc Le Gall",
    businessName: "Poissonnerie de l'Océan",
    description: "Arrivages quotidiens de poissons et fruits de mer.",
    specialties: ["poisson", "fruits de mer", "plateaux"],
    address: "9 quai Saint-Antoine",
    city: "Lyon",
    postalCode: "69002",
    latitude: 45.7650,
    longitude: 4.8350,
    products: [
      { name: "Filet de saumon frais", category: "Poisson", unit: "kg", priceCents: 2790, description: "Saumon d'Écosse label rouge, sans arêtes." },
      { name: "Huîtres Marennes-Oléron n°3", category: "Fruits de mer", unit: "douzaine", priceCents: 1250, description: "Ouvertes à la demande sur commande." },
      { name: "Plateau de fruits de mer (4 pers.)", category: "Plateaux", unit: "plateau", priceCents: 6500, description: "Huîtres, crevettes, bulots, bigorneaux, tourteau." },
      { name: "Crevettes roses cuites", category: "Fruits de mer", unit: "kg", priceCents: 2290, description: "Calibre 30/40, cuites à bord." },
    ],
  },
  {
    email: "fromagerie.alpage@example.com",
    name: "Élise Roche",
    businessName: "Fromagerie de l'Alpage",
    description: "Fromages affinés, produits laitiers fermiers et épicerie fine.",
    specialties: ["fromage", "crémerie", "épicerie fine"],
    address: "3 rue des Capucins",
    city: "Lyon",
    postalCode: "69001",
    latitude: 45.7690,
    longitude: 4.8340,
    products: [
      { name: "Saint-Marcellin affiné", category: "Fromage", unit: "pièce", priceCents: 280, description: "Lait cru, affinage 3 semaines." },
      { name: "Comté AOP 18 mois", category: "Fromage", unit: "kg", priceCents: 3200, description: "Fruité, notes de noisette." },
      { name: "Plateau de fromages (8 pers.)", category: "Plateaux", unit: "plateau", priceCents: 4500, description: "5 fromages affinés, raisin et noix." },
      { name: "Beurre fermier demi-sel", category: "Crémerie", unit: "250 g", priceCents: 450, description: "Baratté à la ferme." },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let productCount = 0;

  for (const s of sellers) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, passwordHash, role: "SELLER" },
    });

    const seller = await prisma.seller.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: s.businessName,
        description: s.description,
        specialties: s.specialties,
        address: s.address,
        city: s.city,
        postalCode: s.postalCode,
        latitude: s.latitude,
        longitude: s.longitude,
        isActive: true,
      },
    });

    for (const p of s.products) {
      const exists = await prisma.product.findFirst({ where: { sellerId: seller.id, name: p.name } });
      if (exists) continue;
      await prisma.product.create({ data: { sellerId: seller.id, ...p } });
      productCount++;
    }
  }

  console.log(`Commerçants : ${sellers.length} | Produits créés : ${productCount}`);
  console.log(`Mot de passe de démonstration : ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
