"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type Demand = { id: string; brief: string; city: string; budgetMaxCents: number | null; requestedAt: string | null; fulfillmentMode: "PICKUP" | "DELIVERY" | null; myOffer: { id: string; subtotalCents: number; status: string } | null };
export default function SellerDemandInbox() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/seller/demands").then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les demandes.");
      setActive(payload.sellerActive); setDemands(payload.demands);
    }).catch(cause => setError(cause instanceof Error ? cause.message : "Erreur de chargement."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/seller/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        demandId: selected,
        items: [{ name: form.get("item"), quantity: Number(form.get("quantity")), unit: form.get("unit"), unitPriceCents: Math.round(Number(form.get("unitPrice")) * 100) }],
        preparationCents: Math.round(Number(form.get("preparation") || 0) * 100),
        deliveryCents: Math.round(Number(form.get("delivery") || 0) * 100),
        notes: form.get("notes"),
        fulfillmentModes: [form.get("mode")],
      }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Proposition impossible.");
      setNotice("Votre proposition a été enregistrée.");
      setDemands(current => current.map(demand => demand.id === selected ? { ...demand, myOffer: { id: payload.offer.id, subtotalCents: payload.offer.subtotalCents, status: payload.offer.status } } : demand));
      setSelected(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Proposition impossible."); }
    finally { setBusy(false); }
  }

  return <section className="section" style={{ paddingBottom: 0 }}>
    <div className="section-heading"><div><div className="eyebrow">Opportunités locales</div><h2>Demandes qui vous sont attribuées</h2></div><p>{demands.length} demande(s)</p></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {!active && <div className="notice">Votre établissement doit être validé par l'équipe FOOD SIGNAL avant de recevoir des demandes.</div>}
    <div style={{ display: "grid", gap: 12 }}>
      {demands.map(demand => <article className="panel" key={demand.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{demand.city}</strong><span className="pill">{demand.myOffer ? "Proposition envoyée" : "Nouvelle demande"}</span></div>
        <p style={{ lineHeight: 1.6 }}>{demand.brief}</p>
        <p className="subtle">Budget indicatif : {demand.budgetMaxCents ? (demand.budgetMaxCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"}) : "non précisé"} · Réception : {demand.fulfillmentMode === "DELIVERY" ? "Livraison souhaitée" : demand.fulfillmentMode === "PICKUP" ? "Retrait souhaité" : "À convenir"}</p>
        {demand.myOffer ? <p className="subtle">Votre offre : {(demand.myOffer.subtotalCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"})} hors frais.</p> : <button className="primary" onClick={() => setSelected(selected === demand.id ? null : demand.id)}>{selected === demand.id ? "Fermer le formulaire" : "Répondre à cette demande"}</button>}
        {selected === demand.id && <form onSubmit={submit} style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div className="two-cols"><div className="field"><label>Produit proposé</label><input name="item" required minLength={2} maxLength={120} placeholder="Ex. panier de légumes"/></div><div className="field"><label>Quantité</label><input name="quantity" type="number" required min="1" max="10000" defaultValue="1"/></div></div>
          <div className="two-cols"><div className="field"><label>Unité</label><input name="unit" required defaultValue="lot" maxLength={30}/></div><div className="field"><label>Prix unitaire (€)</label><input name="unitPrice" type="number" required min="0.01" step="0.01"/></div></div>
          <div className="two-cols"><div className="field"><label>Préparation (€)</label><input name="preparation" type="number" min="0" step="0.01" defaultValue="0"/></div><div className="field"><label>Livraison (€)</label><input name="delivery" type="number" min="0" step="0.01" defaultValue="0"/></div></div>
          <div className="two-cols"><div className="field"><label>Modalité</label><select name="mode" defaultValue="PICKUP"><option value="PICKUP">Retrait</option><option value="DELIVERY">Livraison</option></select></div><div className="field"><label>Précisions</label><input name="notes" maxLength={1000} placeholder="Origine, disponibilité…"/></div></div>
          <button className="primary" type="submit" disabled={busy} style={{ marginTop: 16 }}><Send size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busy ? "Envoi…" : "Envoyer ma proposition"}</button>
        </form>}
      </article>)}
      {active && demands.length === 0 && <div className="panel"><p className="subtle">Aucune demande ne correspond encore à vos spécialités dans votre ville. Revenez consulter votre espace plus tard.</p></div>}
    </div>
  </section>;
}
