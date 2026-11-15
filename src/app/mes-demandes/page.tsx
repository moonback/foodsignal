import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock3, MapPin, Package, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import OrderSelection from "./order-selection";
import { prisma } from "@/lib/prisma";

const demandLabels: Record<string, string> = {
  DRAFT: "En attente de traitement",
  ANALYZING: "En cours d'analyse",
  NEEDS_CLARIFICATION: "Précisions nécessaires",
  OPEN: "Ouverte",
  COLLECTING_OFFERS: "Collecte des propositions",
  PROPOSAL_READY: "Propositions disponibles",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};

function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function MyDemandsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/compte?next=%2Fmes-demandes");
  if (user.role !== "CUSTOMER") redirect("/");

  const demands = await prisma.demand.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, anonymizedBrief: true, city: true, budgetMaxCents: true,
      status: true, createdAt: true, requestedAt: true, fulfillmentMode: true,
      order: { select: { id: true, status: true } },
      offers: {
        where: { status: { in: ["SUBMITTED", "ACCEPTED"] } },
        orderBy: [{ subtotalCents: "asc" }],
        select: {
          id: true, items: true, subtotalCents: true, preparationCents: true,
          deliveryCents: true, notes: true, fulfillmentModes: true, availableAt: true,
          seller: { select: { businessName: true, city: true, specialties: true } },
        },
      },
    },
  });

  return <main className="shell" style={{ paddingTop: 42, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 24px" }}>
      <Link className="brand" href="/"><span className="brand-mark"><Package size={19}/></span>FOOD SIGNAL</Link>
      <Link className="secondary" href="/"><ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>Accueil</Link>
    </header>
    <div className="eyebrow">Espace particulier</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Mes demandes</h1>
    <p className="subtle">Retrouvez vos besoins et comparez les propositions reçues. La confirmation d'une proposition crée une commande. Aucun paiement n'est encaissé en ligne.</p>
    <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
      {demands.map(demand => <article className="panel" key={demand.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><div className="eyebrow">Demande du {demand.createdAt.toLocaleDateString("fr-FR")}</div><h3 style={{ marginTop: 8 }}>{demand.city}</h3></div>
          <span className="pill">{demandLabels[demand.status] || demand.status}</span>
        </div>
        <p style={{ lineHeight: 1.6 }}>{demand.anonymizedBrief}</p>
        <p className="subtle"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{demand.city} · Budget : {demand.budgetMaxCents ? euro(demand.budgetMaxCents) : "libre"} · Réception : {demand.fulfillmentMode === "DELIVERY" ? "Livraison" : demand.fulfillmentMode === "PICKUP" ? "Retrait" : "À convenir"}</p>
        {demand.order && <div className="notice" style={{ marginTop: 14 }}>Une commande est confirmée. <Link href={`/commandes/${demand.order.id}`}>Suivre son avancement</Link></div>}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 18 }}>
          <div className="section-heading"><div><div className="eyebrow">Réponses des professionnels</div><h3>{demand.offers.length} proposition(s)</h3></div></div>
          {demand.offers.length ? <div style={{ display: "grid", gap: 12 }}>
            {demand.offers.map(offer => {
              const total = offer.subtotalCents + offer.preparationCents;
              const items = Array.isArray(offer.items) ? offer.items : [];
              return <div key={offer.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div><strong><Store size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{offer.seller.businessName}</strong><p className="subtle" style={{ margin: "5px 0" }}>{offer.seller.city} · {offer.seller.specialties.join(" · ")}</p></div>
                  <strong style={{ color: "#1e6b4b", fontSize: 20 }}>{euro(total)} <span className="subtle" style={{ display: "block", fontSize: 11, fontWeight: 400 }}>hors livraison</span></strong>
                </div>
                <ul style={{ margin: "14px 0", paddingLeft: 20, color: "#53675a", fontSize: 13 }}>
                  {items.map((raw, index) => {
                    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
                    const item = raw as Record<string, unknown>;
                    return <li key={index}>{String(item.name)} — {String(item.quantity)} {String(item.unit)} × {euro(Number(item.unitPriceCents) || 0)}</li>;
                  })}
                </ul>
                <div className="signal-line"><span>Produits</span><strong>{euro(offer.subtotalCents)}</strong></div>
                <div className="signal-line"><span>Préparation</span><strong>{euro(offer.preparationCents)}</strong></div>
                <div className="signal-line"><span>Livraison</span><strong>{euro(offer.deliveryCents)}</strong></div>
                <p className="subtle"><Clock3 size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Modalités : {offer.fulfillmentModes.map(mode => mode === "PICKUP" ? "Retrait" : "Livraison").join(" / ")}{offer.availableAt ? " · Disponible le "+offer.availableAt.toLocaleString("fr-FR") : ""}</p>
                {offer.notes && <p className="subtle">{offer.notes}</p>}
                {!demand.order && <OrderSelection offerId={offer.id} fulfillmentModes={offer.fulfillmentModes} sellerName={offer.seller.businessName}/>}

              </div>;
            })}
          </div> : <div className="notice">Les commerçants ciblés n'ont pas encore répondu. Vous pourrez comparer leurs offres ici dès leur réception.</div>}
        </div>
      </article>)}
      {demands.length === 0 && <div className="panel"><p className="subtle">Vous n'avez pas encore de demande.</p><Link className="primary" href="/#demande" style={{ display: "inline-block", textDecoration: "none", marginTop: 12 }}>Déposer une demande</Link></div>}
    </div>
  </main>;
}
