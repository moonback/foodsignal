"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Send } from "lucide-react";

type Demand = { id: string; anonymizedBrief: string; city: string; budgetMaxCents: number | null; requestedAt: string | null; suggestedCategories: string[] };
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
    <div className="section-heading"><div><div className="eyebrow">Modération et matching</div><h2>Demandes à diffuser</h2></div><p>{demands.length} en attente</p></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    <div style={{ display: "grid", gap: 12 }}>
      {demands.map(demand => <article className="panel" key={demand.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{demand.city}</strong><span className="pill">{demand.budgetMaxCents ? (demand.budgetMaxCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"}) : "Budget libre"}</span></div>
        <p className="subtle" style={{ color: "#27362d" }}>{demand.anonymizedBrief}</p>
        <p className="subtle">Catégories suggérées : {demand.suggestedCategories.length ? demand.suggestedCategories.join(" · ") : "Aucune — clarification nécessaire"}</p>
        <button className="primary" disabled={busyId === demand.id || demand.suggestedCategories.length === 0} onClick={() => publish(demand.id)}><Send size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busyId === demand.id ? "Diffusion…" : "Diffuser aux commerçants correspondants"} <ArrowRight size={15} style={{ verticalAlign: "middle", marginLeft: 5 }}/></button>
      </article>)}
      {demands.length === 0 && <div className="panel"><p className="subtle">Aucune demande en brouillon à diffuser.</p></div>}
    </div>
    <p className="subtle" style={{ fontSize: 12 }}>La diffusion utilise une correspondance par mots-clés et spécialités dans la même ville. Les coordonnées personnelles et le texte original ne sont pas transmis aux vendeurs. Les demandes ambiguës restent en attente.</p>
  </section>;
}
