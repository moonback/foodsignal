"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Store } from "lucide-react";

const categories = ["Fruits et légumes", "Boucherie", "Poissonnerie", "Boulangerie", "Fromagerie", "Épicerie", "Produits fermiers", "Traiteur", "Boissons", "Autre"];

export default function SellerRegistrationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          description: form.get("description"),
          specialties: selected,
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Une erreur est survenue.");
      router.push("/vendeur");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="shell" style={{ maxWidth: 820, paddingTop: 36, paddingBottom: 80 }}>
    <Link className="secondary" href="/" style={{ textDecoration: "none" }}><ArrowLeft size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Retour</Link>
    <div className="panel" style={{ marginTop: 22 }}>
      <div className="eyebrow"><Store size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Rejoindre le réseau local</div>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", margin: "12px 0" }}>Présentez votre commerce.</h1>
      <p className="subtle">Créez votre profil professionnel. Il restera en attente de validation avant toute diffusion de demandes.</p>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="businessName">Nom du commerce ou de l’exploitation</label><input id="businessName" name="businessName" required minLength={2} maxLength={120}/></div>
        <div className="field"><label htmlFor="description">Présentation (facultatif)</label><textarea id="description" name="description" maxLength={1000} placeholder="Votre savoir-faire, vos engagements, vos produits…"/></div>
        <div className="field"><label>Vos spécialités (au moins une)</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{categories.map(category => <button key={category} type="button" className={selected.includes(category) ? "primary" : "secondary"} onClick={() => setSelected(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category])}>{category}</button>)}</div></div>
        <div className="field"><label htmlFor="address">Adresse professionnelle</label><input id="address" name="address" required minLength={5} maxLength={180} autoComplete="street-address"/></div>
        <div className="two-cols"><div className="field"><label htmlFor="city">Ville</label><input id="city" name="city" required minLength={2} autoComplete="address-level2"/></div><div className="field"><label htmlFor="postalCode">Code postal</label><input id="postalCode" name="postalCode" required minLength={4} maxLength={12} autoComplete="postal-code"/></div></div>
        {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
        <button className="primary" type="submit" disabled={busy || selected.length === 0} style={{ width: "100%", marginTop: 18 }}>{busy ? "Création…" : "Créer mon profil professionnel"}</button>
      </form>
    </div>
  </main>;
}
