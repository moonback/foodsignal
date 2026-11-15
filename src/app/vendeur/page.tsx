import Link from "next/link";
import { redirect } from "next/navigation";
import { Store, Clock3, Package, MapPin, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductCatalog from "./product-catalog";
import SellerDemandInbox from "./seller-demand-inbox";
import SellerOrderActions from "./seller-order-actions";

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
  const orders = await prisma.offer.findMany({
    where: { sellerId: seller.id, status: "ACCEPTED", demand: { order: { isNot: null } } },
    orderBy: { createdAt: "desc" },
    select: {
      demand: {
        select: {
          id: true, city: true, anonymizedBrief: true,
          order: { select: { id: true, status: true, fulfillmentMode: true, totalCents: true, deliveryAddress: true, updatedAt: true } },
        },
      },
    },
  });

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
        <div className="notice"><Clock3 size={17} style={{ verticalAlign: "middle", marginRight: 7 }}/>{seller.isActive ? "Votre établissement peut recevoir les demandes correspondant à ses spécialités et à sa ville." : "Vous pouvez préparer votre catalogue pendant la vérification. Il ne sera pas visible des clients."}</div>
      </section>
      <section className="panel">
        <div className="eyebrow">Votre établissement</div>
        <h3 style={{ marginTop: 12 }}>{seller.businessName}</h3>
        <p className="subtle"><MapPin size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{seller.city}</p>
        <p className="subtle"><Package size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Spécialités : {seller.specialties.join(", ")}</p>
      </section>
    </div>
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="section-heading"><div><div className="eyebrow">Commandes confirmées</div><h2>À préparer et à remettre</h2></div><p>{orders.length} commande(s)</p></div>
      <div style={{ display: "grid", gap: 12 }}>
        {orders.map(({ demand }) => demand.order && <article className="panel" key={demand.order.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><strong>Commande {demand.order.id.slice(-8).toUpperCase()}</strong><p className="subtle">{demand.city} · {demand.order.fulfillmentMode === "DELIVERY" ? "Livraison" : "Retrait"}</p></div>
            <strong>{(demand.order.totalCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</strong>
          </div>
          <p style={{ lineHeight: 1.5 }}>{demand.anonymizedBrief}</p>
          {demand.order.fulfillmentMode === "DELIVERY" && <p className="subtle"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{demand.order.deliveryAddress}</p>}
          <SellerOrderActions orderId={demand.order.id} status={demand.order.status} fulfillmentMode={demand.order.fulfillmentMode}/>
        </article>)}
        {orders.length === 0 && <div className="panel"><p className="subtle">Aucune commande confirmée pour le moment.</p></div>}
      </div>
    </section>
    <SellerDemandInbox />
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="section-heading"><div><div className="eyebrow">Offre commerciale</div><h2>Votre catalogue</h2></div><p>{seller.products.length} produit(s)</p></div>
      <ProductCatalog initialProducts={seller.products}/>
    </section>
  </main>;
}
