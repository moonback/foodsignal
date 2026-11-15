"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Props = { orderId: string; status: string; fulfillmentMode: "PICKUP" | "DELIVERY" };
const nextStatus: Record<string, { value: string; label: string }> = {
  CONFIRMED: { value: "PREPARING", label: "Démarrer la préparation" },
  PREPARING: { value: "READY", label: "Marquer prête au retrait" },
  READY: { value: "COMPLETED", label: "Confirmer la remise" },
  OUT_FOR_DELIVERY: { value: "COMPLETED", label: "Confirmer la livraison" },
};

export default function SellerOrderActions({ orderId, status, fulfillmentMode }: Props) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = current === "PREPARING" && fulfillmentMode === "DELIVERY"
    ? { value: "OUT_FOR_DELIVERY", label: "Confirmer le départ en livraison" }
    : nextStatus[current];

  async function advance() {
    if (!next) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/seller/orders", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: next.value }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Mise à jour impossible.");
      setCurrent(payload.order.status);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mise à jour impossible."); }
    finally { setBusy(false); }
  }

  const labels: Record<string, string> = {
    CONFIRMED: "À préparer", PREPARING: "En préparation", READY: "Prête au retrait",
    OUT_FOR_DELIVERY: "En livraison", COMPLETED: "Terminée", CANCELLED: "Annulée",
  };
  return <div style={{ marginTop: 12 }}>
    <span className="pill">{labels[current] || current}</span>
    {next && <button className="primary" disabled={busy} onClick={advance} style={{ display: "block", marginTop: 12 }}>{busy ? "Mise à jour…" : next.label} <ArrowRight size={15} style={{ verticalAlign: "middle", marginLeft: 5 }}/></button>}
    {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
  </div>;
}
