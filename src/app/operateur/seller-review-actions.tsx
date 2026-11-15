"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

export default function SellerReviewActions({ sellerId, isActive }: { sellerId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operator/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, isActive: next }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Action impossible.");
      setActive(payload.seller.isActive);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
    {!active ? <button className="primary" disabled={busy} onClick={() => update(true)}><Check size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Valider le commerçant</button> : <button className="secondary" disabled={busy} onClick={() => update(false)}><X size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Suspendre l'accès</button>}
    {error && <span role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</span>}
  </div>;
}
