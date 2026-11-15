import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, AlertCircle, CheckCircle2, Clock3, CreditCard, MapPin, Package, Send, Store, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerReviewActions from "./seller-review-actions";
import DemandDistributionPanel from "./demand-distribution-panel";
import OperatorPaymentsDashboard from "./operator-payments-dashboard";
import NotificationCenter from "@/components/notification-center";

const demandLabels: Record<string, string> = {
  DRAFT: "À vérifier",
  ANALYZING: "Analyse en cours",
  NEEDS_CLARIFICATION: "Précision client attendue",
  OPEN: "Ouverte",
  COLLECTING_OFFERS: "Collecte des offres",
  PROPOSAL_READY: "Propositions prêtes",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};
const auditLabels: Record<string, string> = {
  SELLER_ACTIVATED: "Commerçant activé",
  SELLER_SUSPENDED: "Commerçant suspendu",
  DEMAND_DISTRIBUTED: "Demande diffusée",
};

function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function OperatorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/compte?next=%2Foperateur");
  if (user.role !== "OPERATOR") redirect("/");

  const [
    sellers, demandGroups, orderCount, paidAggregate, pendingOffers,
    auditLogs, paymentOrders,
  ] = await Promise.all([
    prisma.seller.findMany({
      orderBy: [{ isActive: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, businessName: true, description: true, specialties: true, address: true,
        city: true, postalCode: true, isActive: true, createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.demand.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalCents: true }, _count: { _all: true } }),
    prisma.offer.count({ where: { status: "SUBMITTED" } }),
    prisma.operatorAuditLog.findMany({
      orderBy: { createdAt: "desc" }, take: 12,
      select: { id: true, action: true, entityType: true, entityId: true, details: true, createdAt: true, actor: { select: { name: true, email: true } } },
    }),
    prisma.order.findMany({
      orderBy: { updatedAt: "desc" }, take: 100,
      select: {
        id: true, status: true, paymentStatus: true, fulfillmentMode: true,
        totalCents: true, paidAt: true, updatedAt: true,
        demand: { select: { city: true, customerName: true, offers: { where: { status: "ACCEPTED" }, select: { seller: { select: { businessName: true } } }, take: 1 } } },
        refunds: { orderBy: { createdAt: "desc" }, select: { id: true, stripeRefundId: true, amountCents: true, status: true, reason: true, createdAt: true } },
        disputes: { orderBy: { updatedAt: "desc" }, select: { id: true, stripeDisputeId: true, status: true, amountCents: true, currency: true, reason: true, updatedAt: true } },
      },
    }),
  ]);

  const countByStatus = Object.fromEntries(demandGroups.map(group => [group.status, group._count._all])) as Record<string, number>;
  const totalDemands = demandGroups.reduce((sum, group) => sum + group._count._all, 0);
  const pendingSellers = sellers.filter(seller => !seller.isActive).length;
  const activeSellers = sellers.length - pendingSellers;
  const initialPaymentOrders = paymentOrders.map(order => ({
    ...order,
    paidAt: order.paidAt?.toISOString() ?? null,
    updatedAt: order.updatedAt.toISOString(),
    refunds: order.refunds.map(refund => ({ ...refund, createdAt: refund.createdAt.toISOString() })),
    disputes: order.disputes.map(dispute => ({ ...dispute, updatedAt: dispute.updatedAt.toISOString() })),
  }));

  const metrics = [
    { label: "Demandes", value: totalDemands, detail: `${countByStatus.DRAFT || 0} à vérifier · ${countByStatus.NEEDS_CLARIFICATION || 0} à clarifier`, icon: Package },
    { label: "Commerçants actifs", value: activeSellers, detail: `${pendingSellers} profil(s) en attente`, icon: Store },
    { label: "Offres à examiner", value: pendingOffers, detail: "Propositions déposées par les vendeurs", icon: Send },
    { label: "Commandes", value: orderCount, detail: `${paidAggregate._count._all} payée(s) · ${euro(paidAggregate._sum.totalCents || 0)} encaissés`, icon: CreditCard },
  ];

  return <main className="shell" style={{ paddingTop: 42, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 24px" }}>
      <Link className="brand" href="/"><span className="brand-mark"><Store size={19}/></span>FOOD SIGNAL</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><NotificationCenter/><span className="pill">Console opérateur</span></div>
    </header>

    <div className="eyebrow">Pilotage de la marketplace</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Administration</h1>
    <p className="subtle">Vue opérationnelle du réseau, des demandes, des offres, des commandes et des actions administratives.</p>

    <section aria-label="Indicateurs de la marketplace" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginTop: 24 }}>
      {metrics.map(metric => {
        const Icon = metric.icon;
        return <article className="panel" key={metric.label} style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="eyebrow">{metric.label}</span><Icon size={18} color="#1e6b4b"/></div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.04em", marginTop: 12 }}>{metric.value}</div>
          <p className="subtle" style={{ marginBottom: 0 }}>{metric.detail}</p>
        </article>;
      })}
    </section>

    <section className="panel" style={{ marginTop: 18 }}>
      <div className="section-heading"><div><div className="eyebrow">Cycle des demandes</div><h2>Répartition par statut</h2></div><span className="pill">{totalDemands} au total</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {Object.entries(demandLabels).map(([status, label]) => <div key={status} style={{ background: "#f7f8f3", border: "1px solid var(--line)", borderRadius: 12, padding: 13 }}>
          <div style={{ fontSize: 25, fontWeight: 800 }}>{countByStatus[status] || 0}</div><div className="subtle">{label}</div>
        </div>)}
      </div>
    </section>

    <section className="panel" style={{ marginTop: 18 }}>
      <div className="section-heading"><div><div className="eyebrow">Traçabilité</div><h2>Journal des actions opérateur</h2></div><Activity size={20} color="#1e6b4b"/></div>
      {auditLogs.length ? <div style={{ display: "grid", gap: 0 }}>
        {auditLogs.map(log => <div key={log.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div><strong>{auditLabels[log.action] || log.action}</strong><div className="subtle">{log.actor?.name || "Compte opérateur supprimé"} · {log.entityType} · {log.entityId.slice(0, 10)}</div></div>
          <time className="subtle" dateTime={log.createdAt.toISOString()}>{log.createdAt.toLocaleString("fr-FR")}</time>
        </div>)}
      </div> : <p className="subtle">Aucune action administrative enregistrée pour le moment.</p>}
      <p className="subtle" style={{ fontSize: 12, marginBottom: 0 }}>Le journal conserve les activations, suspensions et diffusions de demandes. Il ne remplace pas encore un journal de sécurité externe inviolable.</p>
    </section>

    <DemandDistributionPanel />
    <OperatorPaymentsDashboard initialOrders={initialPaymentOrders} />

    <div className="section-heading" style={{ marginTop: 30 }}><div><div className="eyebrow">Réseau local</div><h2>Validation des commerçants</h2></div><p>{pendingSellers} en attente · {activeSellers} actifs</p></div>
    <p className="subtle">Vérifiez les informations de chaque établissement avant de l'autoriser à recevoir des demandes.</p>
    <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
      {sellers.map(seller => <article className="panel" key={seller.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div><div className="eyebrow">{seller.isActive ? "Actif" : "À vérifier"}</div><h3 style={{ marginTop: 8 }}>{seller.businessName}</h3><p className="subtle">{seller.user.name} · {seller.user.email}</p></div>
          <span className="pill">{seller.isActive ? "Validé" : "En attente"}</span>
        </div>
        {seller.description && <p className="subtle">{seller.description}</p>}
        <p className="subtle"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{seller.address}, {seller.postalCode} {seller.city}</p>
        <p className="subtle"><Store size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{seller.specialties.join(" · ")} <span style={{ marginLeft: 10 }}><Package size={14} style={{ verticalAlign: "middle" }}/> {seller._count.products} produit(s)</span></p>
        <SellerReviewActions sellerId={seller.id} isActive={seller.isActive}/>
      </article>)}
      {sellers.length === 0 && <div className="panel"><p className="subtle">Aucun professionnel inscrit pour le moment.</p></div>}
    </div>
  </main>;
}
