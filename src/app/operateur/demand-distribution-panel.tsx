"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Send, Sparkles } from "lucide-react";

type Demand = {
  id: string; anonymizedBrief: string; city: string; budgetMaxCents: number | null;
  requestedAt: string | null; suggestedCategories: string[]; candidateCount: number;
  topMatches: Array<{ score: number; reasons: string[]; matchedCategories: string[] }>;
};
export default function DemandDistributionPanel() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/operator/demands")
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Impossible de charger les demandes.");
        setDemands(payload.demands);
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : "Erreur de chargement."));
  }, []);

  async function publish(id: string) {
    setBusyId(id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/operator/demands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demandId: id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Diffusion impossible.");
      setNotice(`Demande diffusée à ${payload.matchedSellers} commerçant(s) : ${payload.categories.join(", ")}.`);
      setDemands(current => current.filter(demand => demand.id !== id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Diffusion impossible."); }
    finally { setBusyId(""); }
  }

  return <section className="section" style={{ paddingBottom: 28 }}>
    <div className="section-heading"><div><div className="eyebrow">Matching intelligent</div><h2>Demandes à distribuer</h2></div><p>{demands.length} en attente</p></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    <div style={{ display: "grid", gap: 12 }}>
      {demands.map(demand => <article className="panel" key={demand.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{demand.city}</strong><span className="pill">{demand.budgetMaxCents ? (demand.budgetMaxCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"}) : "Budget libre"}</span></div>
        <p className="subtle" style={{ color: "#27362d" }}>{demand.anonymizedBrief}</p>
        <p className="subtle">Catégories détectées : {demand.suggestedCategories.length ? demand.suggestedCategories.join(" · ") : "Aucune — clarification nécessaire"}</p>
        <div className="notice" style={{ marginTop: 12 }}>
          <Sparkles size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>
          {demand.candidateCount} professionnel(s) pertinents identifiés
          {demand.topMatches.length > 0 && <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            {demand.topMatches.map((match, index) => <li key={index} style={{ marginTop: 5 }}>
              <strong>{match.score}/100</strong> — {match.matchedCategories.join(", ") || "correspondance textuelle"} · {match.reasons.slice(0, 2).join(" ; ")}
            </li>)}
          </ul>}
        </div>
        <button className="primary" disabled={busyId === demand.id || demand.suggestedCategories.length === 0 || demand.candidateCount === 0} onClick={() => publish(demand.id)}>
          <Send size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busyId === demand.id ? "Diffusion…" : "Diffuser aux meilleurs correspondants"} <ArrowRight size={15} style={{ verticalAlign: "middle", marginLeft: 5 }}/>
        </button>
      </article>)}
      {demands.length === 0 && <div className="panel"><p className="subtle">Aucune demande en brouillon à diffuser.</p></div>}
    </div>
    <p className="subtle" style={{ fontSize: 12 }}>Score explicable fondé sur les spécialités, le catalogue disponible, la ville et des indices de budget. Seuls les professionnels actifs de la ville sont éligibles ; les 10 meilleurs scores (minimum 25/100) reçoivent la demande. Ce score aide l'opérateur et ne garantit ni disponibilité réelle, ni prix final, ni capacité de livraison.</p>
  </section>;
}
