"use client";

import { useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";

export default function OrderPayment({ orderId, paymentStatus, orderStatus }: { orderId: string; paymentStatus: string; orderStatus: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Paiement indisponible.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Paiement indisponible.");
      setBusy(false);
    }
  }

  const paid = paymentStatus === "PAID";
  return <section className="panel" style={{ marginTop: 16 }}>
    <div className="eyebrow">Règlement</div>
    <h2 style={{ fontSize: 20, marginTop: 8 }}>{paid ? "Paiement confirmé" : paymentStatus === "FAILED" ? "Paiement non abouti" : "Paiement en attente"}</h2>
    {paid
      ? <p className="notice">Stripe a confirmé le règlement. Le commerçant peut commencer la préparation.</p>
      : <><p className="subtle">Le paiement est traité sur la page sécurisée de Stripe. La commande ne passe en préparation qu'après confirmation du webhook.</p>
        {orderStatus === "CONFIRMED" && <button className="primary" type="button" disabled={busy} onClick={pay} style={{ marginTop: 10 }}><CreditCard size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busy ? "Redirection…" : paymentStatus === "FAILED" ? "Réessayer le paiement" : "Payer maintenant"}</button>}
      </>}
    {error && <p role="alert" style={{ color: "#b42318", fontSize: 13, marginTop: 10 }}>{error}</p>}
    {!paid && <button className="secondary" type="button" onClick={() => window.location.reload()} style={{ marginTop: 10 }}><RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Actualiser le statut</button>}
  </section>;
}
