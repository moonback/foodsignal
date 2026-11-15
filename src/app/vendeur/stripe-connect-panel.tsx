"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";

type Status = { connected: boolean; chargesEnabled?: boolean; payoutsEnabled?: boolean; transfersEnabled?: boolean; ready?: boolean };
export default function StripeConnectPanel({ hasAccount, initiallyReady, active }: { hasAccount: boolean; initiallyReady: boolean; active: boolean }) {
  const [status, setStatus] = useState<Status>({ connected: hasAccount, ready: initiallyReady });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/seller/stripe/connect", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Vérification Stripe impossible.");
      setStatus(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vérification Stripe impossible.");
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (hasAccount || new URLSearchParams(window.location.search).has("stripe")) void refresh();
  }, [hasAccount, refresh]);

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/seller/stripe/connect", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Connexion Stripe impossible.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion Stripe impossible.");
      setBusy(false);
    }
  }

  return <section className="panel">
    <div className="eyebrow">Paiements sécurisés</div>
    <h2 style={{ marginTop: 10, fontSize: 22 }}>Connecter votre compte Stripe</h2>
    <p className="subtle">Stripe collecte directement vos informations bancaires et vérifie votre identité. FOOD SIGNAL ne stocke pas vos coordonnées bancaires.</p>
    {!active && <div className="notice">La connexion Stripe sera disponible après validation de votre établissement.</div>}
    {active && <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
      <div className="signal-line"><span>Compte Stripe</span><strong>{status.connected ? "Rattaché" : "Non connecté"}</strong></div>
      <div className="signal-line"><span>Transferts</span><strong>{status.transfersEnabled ? "Activés" : "À vérifier"}</strong></div>
      <div className="signal-line"><span>Versements</span><strong>{status.payoutsEnabled ? "Activés" : "À vérifier"}</strong></div>
      <div className="signal-line"><span>État</span><strong>{status.ready ? "Prêt à recevoir des commandes payées" : "Configuration incomplète"}</strong></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button className="primary" type="button" disabled={busy} onClick={start}><ExternalLink size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busy ? "Ouverture…" : status.connected ? "Reprendre la vérification Stripe" : "Configurer Stripe"}</button>
        {status.connected && <button className="secondary" type="button" disabled={busy} onClick={refresh}><RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Actualiser</button>}
      </div>
    </div>}
    {error && <p role="alert" style={{ color: "#b42318", fontSize: 13, marginTop: 10 }}>{error}</p>}
    <p className="subtle" style={{ fontSize: 12, marginTop: 12 }}><ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 5 }}/>L'activation dépend des vérifications et exigences de Stripe.</p>
  </section>;
}
