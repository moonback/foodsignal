"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  fulfillmentMode: string;
  totalCents: number;
  paidAt: string | null;
  updatedAt: string;
  demand: { city: string; customerName: string; offers: { seller: { businessName: string } }[] };
  refunds: { id: string; stripeRefundId: string | null; amountCents: number; status: string; reason: string; createdAt: string }[];
  disputes: { id: string; stripeDisputeId: string; status: string; amountCents: number; currency: string; reason: string; updatedAt: string }[];
};

type Props = { initialOrders: Order[] };
const money = (amount: number) => (amount / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const paymentLabels: Record<string, string> = { PENDING: "En attente", PAID: "Payée", FAILED: "Échec", REFUNDED: "Remboursée" };
const refundLabels: Record<string, string> = { PENDING: "En cours", SUCCEEDED: "Réussi", FAILED: "Échec" };
const disputeLabels: Record<string, string> = {
  WARNING_NEEDS_RESPONSE: "Alerte — réponse requise", WARNING_UNDER_REVIEW: "Alerte — examen en cours",
  WARNING_CLOSED: "Alerte clôturée", NEEDS_RESPONSE: "Réponse requise", UNDER_REVIEW: "En examen",
  WON: "Gagné", LOST: "Perdu",
};

export default function OperatorPaymentsDashboard({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("ALL");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => orders.filter(order => {
    if (filter === "ALL") return true;
    if (filter === "DISPUTE") return order.disputes.some(d => !["WON", "LOST", "WARNING_CLOSED"].includes(d.status));
    if (filter === "REFUND") return order.refunds.length > 0 || order.paymentStatus === "REFUNDED";
    return order.paymentStatus === filter;
  }), [orders, filter]);

  const paidTotal = orders.filter(o => o.paymentStatus === "PAID").reduce((sum, o) => sum + o.totalCents, 0);
  const refundedTotal = orders.flatMap(o => o.refunds).filter(r => r.status === "SUCCEEDED").reduce((sum, r) => sum + r.amountCents, 0);
  const openDisputes = orders.reduce((sum, o) => sum + o.disputes.filter(d => !["WON", "LOST", "WARNING_CLOSED"].includes(d.status)).length, 0);

  async function refresh() {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/operator/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Actualisation impossible.");
      setOrders(data.orders);
      setNotice("Données actualisées.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Actualisation impossible."); }
  }

  async function refund(order: Order) {
    const reason = (reasons[order.id] || "").trim();
    if (reason.length < 10) { setError("Le motif doit contenir au moins 10 caractères."); return; }
    if (!window.confirm(`Confirmer le remboursement intégral de ${money(order.totalCents)} pour la commande ${order.id.slice(-8).toUpperCase()} ?`)) return;
    setBusyId(order.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/operator/orders/${order.id}/refund`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Remboursement impossible.");
      setNotice(`Demande de remboursement transmise à Stripe : ${data.refund.status}.`);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Remboursement impossible."); }
    finally { setBusyId(""); }
  }

  return <section className="section" style={{ paddingTop: 8 }}>
    <div className="section-heading">
      <div><div className="eyebrow">Finance & conformité</div><h2>Paiements, remboursements et litiges</h2><p className="subtle">Suivi des 100 commandes les plus récentes. Les statuts de paiement proviennent des webhooks Stripe.</p></div>
      <button className="secondary" onClick={refresh} type="button"><RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>Actualiser</button>
    </div>

    <div className="request-layout" style={{ marginBottom: 22 }}>
      <article className="panel"><div className="eyebrow">Paiements confirmés</div><h2 style={{ fontSize: 30, margin: "10px 0" }}>{money(paidTotal)}</h2><p className="subtle">{orders.filter(o => o.paymentStatus === "PAID").length} commande(s) payée(s)</p><CreditCard color="#1e6b4b"/></article>
      <article className="panel"><div className="eyebrow">Remboursements réussis</div><h2 style={{ fontSize: 30, margin: "10px 0" }}>{money(refundedTotal)}</h2><p className="subtle">{orders.flatMap(o => o.refunds).filter(r => r.status === "SUCCEEDED").length} opération(s) confirmée(s)</p><RotateCcw color="#1e6b4b"/></article>
      <article className="panel"><div className="eyebrow">Litiges à surveiller</div><h2 style={{ fontSize: 30, margin: "10px 0" }}>{openDisputes}</h2><p className="subtle">Dossiers non clôturés</p><ShieldAlert color={openDisputes ? "#b7791f" : "#1e6b4b"}/></article>
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      {[
        ["ALL", "Toutes"], ["PAID", "Payées"], ["PENDING", "En attente"], ["FAILED", "Échecs"], ["REFUND", "Remboursements"], ["DISPUTE", "Litiges"],
      ].map(([value, label]) => <button key={value} type="button" className={filter === value ? "primary" : "secondary"} onClick={() => setFilter(value)}>{label}</button>)}
    </div>

    {error && <div className="notice" role="alert" style={{ background: "#fff0ed", color: "#9d3022", marginBottom: 14 }}>{error}</div>}
    {notice && <div className="notice" role="status" style={{ marginBottom: 14 }}>{notice}</div>}

    <div style={{ display: "grid", gap: 14 }}>
      {filtered.map(order => {
        const seller = order.demand.offers[0]?.seller.businessName || "Commerçant non identifié";
        const activeDisputes = order.disputes.filter(d => !["WON", "LOST", "WARNING_CLOSED"].includes(d.status));
        const canRefund = order.paymentStatus === "PAID" && !order.refunds.some(r => r.status === "PENDING" || r.status === "SUCCEEDED");
        return <article className="panel" key={order.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><div className="eyebrow">Commande {order.id.slice(-8).toUpperCase()}</div><h3 style={{ marginTop: 8 }}>{seller}</h3><p className="subtle">{order.demand.customerName} · {order.demand.city} · {order.fulfillmentMode === "DELIVERY" ? "Livraison" : "Retrait"}</p></div>
            <div style={{ textAlign: "right" }}><strong style={{ fontSize: 20 }}>{money(order.totalCents)}</strong><p><span className="pill">{paymentLabels[order.paymentStatus] || order.paymentStatus}</span></p></div>
          </div>
          <p className="subtle">Commande : {order.status} · {order.paidAt ? `Payée le ${new Date(order.paidAt).toLocaleString("fr-FR")}` : "Paiement non confirmé"}</p>

          {order.refunds.length > 0 && <div className="notice" style={{ marginTop: 10 }}>
            <strong><RotateCcw size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Historique des remboursements</strong>
            {order.refunds.map(item => <p key={item.id} style={{ margin: "7px 0 0" }}>{money(item.amountCents)} · {refundLabels[item.status] || item.status} · {item.reason}</p>)}
          </div>}

          {order.disputes.length > 0 && <div className="notice" style={{ marginTop: 10, background: activeDisputes.length ? "#fff4e5" : "#f1f6eb", color: activeDisputes.length ? "#8a4b12" : "#49624e" }}>
            <strong><AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Litiges Stripe</strong>
            {order.disputes.map(item => <p key={item.id} style={{ margin: "7px 0 0" }}>{disputeLabels[item.status] || item.status} · {money(item.amountCents)} · Motif Stripe : {item.reason}</p>)}
            {activeDisputes.length > 0 && <p style={{ marginBottom: 0 }}>Action requise : examiner ce dossier dans le Dashboard Stripe. Aucune réponse n'est envoyée automatiquement.</p>}
          </div>}

          {canRefund && <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <div className="field"><label htmlFor={`reason-${order.id}`}>Motif du remboursement intégral</label><textarea id={`reason-${order.id}`} rows={2} value={reasons[order.id] || ""} onChange={event => setReasons(old => ({ ...old, [order.id]: event.target.value }))} placeholder="Décrivez la raison opérationnelle (10 caractères minimum)…"/></div>
            <button type="button" className="primary" disabled={busyId === order.id || (reasons[order.id] || "").trim().length < 10} onClick={() => refund(order)}>{busyId === order.id ? "Transmission à Stripe…" : `Rembourser ${money(order.totalCents)}`}</button>
          </div>}
        </article>;
      })}
      {filtered.length === 0 && <div className="panel"><p className="subtle">Aucune commande ne correspond à ce filtre.</p></div>}
    </div>
    <p className="subtle" style={{ marginTop: 16 }}><Clock3 size={13} style={{ verticalAlign: "middle", marginRight: 5 }}/>Un remboursement en attente ou échoué doit être rapproché dans Stripe avant toute nouvelle intervention. Les litiges sont traités manuellement dans Stripe.</p>
  </section>;
}
