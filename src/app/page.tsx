"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Leaf, MapPin, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";

type Result = { demand: { id: string; status: string; createdAt: string } };

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [mode, setMode] = useState<"PICKUP" | "DELIVERY">("PICKUP");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    const form = new FormData(event.currentTarget);
    const budget = String(form.get("budget") || "").trim();
    try {
      const response = await fetch("/api/demands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        description: form.get("description"), city: form.get("city"), postalCode: form.get("postalCode"),
        budgetEuros: budget ? Number(budget) : undefined, customerName: form.get("name"), customerEmail: form.get("email"), fulfillmentMode: mode,
      }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Une erreur est survenue.");
      setResult(payload as Result); event.currentTarget.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="shell topbar"><a className="brand" href="#" aria-label="FOOD SIGNAL accueil"><span className="brand-mark"><Leaf size={19}/></span>FOOD SIGNAL</a><nav className="nav"><a href="#fonctionnement">Comment ça marche</a><a href="#demande">Faire une demande</a><a href="#vendeurs">Professionnels</a></nav><a className="secondary" href="#demande" style={{textDecoration:"none"}}>Exprimer un besoin <ArrowRight size={14} style={{verticalAlign:"middle"}}/></a></header>
    <section className="shell hero"><div><div className="eyebrow">Le marché alimentaire, à votre écoute</div><h1>Vous exprimez l’envie. Les commerçants font leur proposition.</h1><p>Ne cherchez plus chaque produit un par un. Décrivez ce dont vous avez besoin : FOOD SIGNAL organise la rencontre avec les commerçants et producteurs de votre secteur.</p><a className="primary" href="#demande" style={{display:"inline-flex",alignItems:"center",gap:10,textDecoration:"none",marginTop:12}}>Décrire mon besoin <ArrowRight size={17}/></a><div style={{display:"flex",gap:18,marginTop:24,color:"#66746b",fontSize:12}}><span><ShieldCheck size={15} style={{verticalAlign:"middle"}}/> Demande anonymisée</span><span><MapPin size={15} style={{verticalAlign:"middle"}}/> Offre locale</span></div></div>
      <div className="hero-panel"><div className="signal-card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>Votre besoin, en quelques mots</strong><span className="pill">Exemple</span></div><p style={{fontSize:15,lineHeight:1.6,color:"#647168",margin:"18px 0"}}>« Un panier de légumes de saison et de quoi préparer un repas pour 4 personnes, autour de 35 €. »</p><div className="signal-line"><span>Compréhension du besoin</span><strong style={{color:"#1e6b4b"}}>À analyser</strong></div><div className="signal-line"><span>Commerçants ciblés</span><strong>Selon votre zone</strong></div><div className="signal-line"><span>Votre décision</span><strong>Vous gardez le choix</strong></div></div></div></section>
    <section className="shell section" id="fonctionnement"><div className="section-heading"><div><div className="eyebrow">Simple et transparent</div><h2>Le commerce part de votre besoin.</h2></div><p>Vous gardez la main à chaque étape.</p></div><div className="request-layout"><div className="panel"><div className="steps"><div className="step"><div className="step-number">01</div><div><strong>Décrivez ce que vous cherchez</strong><span>En langage naturel, avec vos quantités, votre budget et vos préférences.</span></div></div><div className="step"><div className="step-number">02</div><div><strong>Les professionnels répondent</strong><span>Votre demande est préparée pour être partagée sans exposer vos coordonnées personnelles.</span></div></div><div className="step"><div className="step-number">03</div><div><strong>Comparez avant de décider</strong><span>Produits, prix, disponibilité et modalités de réception sont présentés clairement.</span></div></div><div className="step"><div className="step-number">04</div><div><strong>Choisissez votre réception</strong><span>Retrait chez le commerçant ou livraison locale, selon les offres disponibles.</span></div></div></div></div><div className="panel" id="vendeurs"><div className="eyebrow">Côté professionnels</div><h3>Commerçants & producteurs</h3><p className="subtle">Recevez des demandes locales qui correspondent à votre activité. Vous restez libre de vos produits, de vos prix, de vos quantités et de vos disponibilités.</p><div className="notice"><Store size={17} style={{verticalAlign:"middle",marginRight:7}}/> Le pilote ne prévoit pas de frais fixes d’abonnement ou de référencement pour les commerçants.</div><div style={{display:"flex",gap:10,marginTop:22,alignItems:"center",color:"#53675a",fontSize:13}}><Truck size={18}/> Retrait et livraison partenaire locale</div></div></div></section>
    <section className="shell section" id="demande" style={{paddingTop:0}}><div className="section-heading"><div><div className="eyebrow">À vous de jouer</div><h2>Quelle est votre demande alimentaire ?</h2></div><p>Quelques informations pour démarrer.</p></div><div className="request-layout"><form className="panel" onSubmit={submit}><h3>Décrivez votre besoin</h3><p className="subtle">Plus votre demande est précise, plus les professionnels pourront vous répondre utilement.</p>
      <div className="field"><label htmlFor="description">Que souhaitez-vous acheter ?</label><textarea id="description" name="description" minLength={20} maxLength={4000} required placeholder="Ex. : Je prépare un barbecue pour 6 personnes. Je cherche de la viande, des légumes de saison et du pain, avec un budget de 60 €…"/></div>
      <div className="two-cols"><div className="field"><label htmlFor="budget">Budget maximum (€)</label><input id="budget" name="budget" type="number" min="1" max="10000" step="0.01" placeholder="Ex. : 60"/></div><div className="field"><label htmlFor="city">Ville du pilote</label><input id="city" name="city" required minLength={2} placeholder="Votre ville"/></div></div>
      <div className="two-cols"><div className="field"><label htmlFor="postalCode">Code postal</label><input id="postalCode" name="postalCode" maxLength={12} placeholder="Ex. : 78130"/></div><div className="field"><label>Réception souhaitée</label><select value={mode} onChange={e=>setMode(e.target.value as "PICKUP"|"DELIVERY")}><option value="PICKUP">Retrait chez le commerçant</option><option value="DELIVERY">Livraison à domicile</option></select></div></div>
      <div className="two-cols"><div className="field"><label htmlFor="name">Votre nom</label><input id="name" name="name" required minLength={2} autoComplete="name" placeholder="Nom et prénom"/></div><div className="field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr"/></div></div>
      {error && <p role="alert" style={{color:"#b42318",fontSize:13}}>{error}</p>}
      {result && <div className="notice" role="status"><Check size={17} style={{verticalAlign:"middle",marginRight:7}}/> Demande enregistrée sous la référence {result.demand.id}. Elle est sauvegardée en brouillon ; aucune offre n’a encore été sollicitée.</div>}
      <button className="primary" type="submit" disabled={busy} style={{marginTop:22,width:"100%"}}>{busy?"Enregistrement…":"Enregistrer ma demande"} <ArrowRight size={16} style={{verticalAlign:"middle",marginLeft:8}}/></button><p className="subtle" style={{fontSize:11,marginTop:12}}>Vos coordonnées servent à rattacher votre demande à votre compte. Elles ne sont pas incluses dans le résumé anonymisé destiné aux vendeurs.</p>
    </form><aside className="panel"><Sparkles size={22} color="#1e6b4b"/><h3 style={{marginTop:14}}>Une proposition lisible, pas une boîte noire.</h3><p className="subtle">L’objectif de FOOD SIGNAL est de vous présenter des offres comparables, en tenant compte du prix, de la qualité déclarée, des disponibilités et des conditions de réception.</p><div className="notice">Le service est en phase de construction du pilote. L’analyse IA, la diffusion aux vendeurs, les paiements et le suivi logistique ne sont pas encore activés dans cette première fondation technique.</div></aside></div></section>
    <footer className="shell footer"><span>© {new Date().getFullYear()} FOOD SIGNAL</span><span>Le marché alimentaire commence par votre besoin.</span></footer>
  </main>;
}
