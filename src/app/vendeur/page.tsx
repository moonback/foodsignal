import Link from "next/link";
import { redirect } from "next/navigation";
import { Store, Clock3, Package, MapPin, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductCatalog from "./product-catalog";
import SellerDemandInbox from "./seller-demand-inbox";

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/compte?next=%2Fvendeur");
  if (user.role !== "SELLER") redirect("/vendeur/inscription");

  const seller = await prisma.seller.findUnique({
    where: { userId: user.id },
    select: {
      id: true, businessName: true, city: true, isActive: true, specialties: true,
      products: { orderBy: [{ isAvailable: "desc" }, { name: "asc" }], select: { id: true, name: true, category: true, unit: true, description: true, priceCents: true, isAvailable: true } },
    },
  });
  if (!seller) redirect("/");

  return <main className="shell" style={{ paddingTop: 42, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 24px" }}>
      <Link className="brand" href="/"><span className="brand-mark"><Store size={19}/></span>FOOD SIGNAL</Link>
      <Link className="secondary" href="/"><ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>Accueil</Link>
    </header>
    <div className="eyebrow">Espace professionnel</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)", margin: "12px 0" }}>Bonjour, {seller.businessName}.</h1>
    <p className="subtle">Gérez les informations de votre établissement et préparez votre catalogue de produits.</p>
    <div className="request-layout" style={{ marginTop: 24 }}>
      <section className="panel">
        <div className="eyebrow">Statut du compte</div>
        <h3 style={{ marginTop: 12 }}>{seller.isActive ? "Compte validé" : "Vérification en attente"}</h3>
        <p className="subtle">{seller.isActive ? "Votre établissement est activé par l'équipe FOOD SIGNAL." : "Votre profil est enregistré mais ne reçoit pas encore de demandes. Une validation opérateur est nécessaire."}</p>
        <div className="notice"><Clock3 size={17} style={{ verticalAlign: "middle", marginRight: 7 }}/>{seller.isActive ? "Votre catalogue est prêt à être préparé. Le matching n'est pas encore ouvert." : "Vous pouvez préparer votre catalogue pendant la vérification. Il ne sera pas visible des clients."}</div>
      </section>
      <section className="panel">
        <div className="eyebrow">Votre établissement</div>
        <h3 style={{ marginTop: 12 }}>{seller.businessName}</h3>
        <p className="subtle"><MapPin size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{seller.city}</p>
        <p className="subtle"><Package size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Spécialités : {seller.specialties.join(", ")}</p>
      </section>
    </div>
    <SellerDemandInbox />
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="section-heading"><div><div className="eyebrow">Offre commerciale</div><h2>Votre catalogue</h2></div><p>{seller.products.length} produit(s)</p></div>
      <ProductCatalog initialProducts={seller.products}/>
    </section>
  </main>;
}
