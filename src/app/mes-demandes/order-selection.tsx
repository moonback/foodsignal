"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type Props = {
  offerId: string;
  fulfillmentModes: ("PICKUP" | "DELIVERY")[];
  sellerName: string;
};

export default function OrderSelection({ offerId, fulfillmentModes, sellerName }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"PICKUP" | "DELIVERY">(fulfillmentModes.includes("PICKUP") ? "PICKUP" : "DELIVERY");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, fulfillmentMode: mode, deliveryAddress: mode === "DELIVERY" ? address : undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Confirmation impossible.");
      router.push(`/commandes/${payload.order.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Confirmation impossible.");
      setBusy(false);
    }
  }

  return <form onSubmit={submit} style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
    <div className="field"><label>Mode de réception</label>
      <select value={mode} onChange={event => setMode(event.target.value as "PICKUP" | "DELIVERY")}>
        {fulfillmentModes.includes("PICKUP") && <option value="PICKUP">Retrait chez {sellerName}</option>}
        {fulfillmentModes.includes("DELIVERY") && <option value="DELIVERY">Livraison</option>}
      </select>
    </div>
    {mode === "DELIVERY" && <div className="field" style={{ marginTop: 10 }}><label>Adresse de livraison</label><textarea required minLength={8} maxLength={300} value={address} onChange={event => setAddress(event.target.value)} placeholder="Numéro, rue, code postal, ville"/></div>}
    {error && <p role="alert" style={{ color: "#b42318", fontSize: 13 }}>{error}</p>}
    <button className="primary" type="submit" disabled={busy} style={{ marginTop: 12 }}><CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busy ? "Confirmation…" : "Confirmer cette commande"}</button>
    <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>La confirmation réserve cette proposition. Aucun paiement n'est effectué en ligne.</p>
  </form>;
}
