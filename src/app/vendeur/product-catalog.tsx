"use client";

import { useState, type FormEvent } from "react";
import { Check, PackagePlus, Pencil, Trash2, X } from "lucide-react";

type Product = { id: string; name: string; category: string; unit: string; description: string | null; priceCents: number; isAvailable: boolean };
const blank = { name: "", category: "Fruits et légumes", unit: "kg", description: "", priceEuros: "", isAvailable: true };

export default function ProductCatalog({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function beginEdit(product: Product) {
    setEditing(product.id);
    setForm({ name: product.name, category: product.category, unit: product.unit, description: product.description || "", priceEuros: (product.priceCents / 100).toFixed(2), isAvailable: product.isAvailable });
    setError(""); setMessage("");
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function reset() { setEditing(null); setForm(blank); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/seller/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editing ? { id: editing } : {}), ...form, priceEuros: Number(form.priceEuros) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Enregistrement impossible.");
      if (editing) setProducts(current => current.map(item => item.id === editing ? payload.product : item));
      else setProducts(current => [...current, payload.product].sort((a,b) => a.name.localeCompare(b.name, "fr")));
      setMessage(editing ? "Produit mis à jour." : "Produit ajouté au catalogue.");
      reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement ce produit du catalogue ?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/seller/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Suppression impossible.");
      setProducts(current => current.filter(item => item.id !== id));
      if (editing === id) reset();
      setMessage("Produit supprimé.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Suppression impossible."); }
    finally { setBusy(false); }
  }

  async function toggle(product: Product) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/seller/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, isAvailable: !product.isAvailable }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Mise à jour impossible.");
      setProducts(current => current.map(item => item.id === product.id ? payload.product : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mise à jour impossible."); }
    finally { setBusy(false); }
  }

  return <div style={{ display: "grid", gap: 20 }}>
    <form id="product-form" className="panel" onSubmit={submit}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h3>{editing ? "Modifier le produit" : "Ajouter un produit"}</h3>{editing && <button type="button" className="secondary" onClick={reset}><X size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Annuler</button>}</div>
      <div className="two-cols">
        <div className="field"><label htmlFor="product-name">Nom du produit</label><input id="product-name" required minLength={2} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tomates anciennes"/></div>
        <div className="field"><label htmlFor="product-category">Catégorie</label><select id="product-category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Fruits et légumes","Boucherie","Poissonnerie","Boulangerie","Fromagerie","Épicerie","Produits fermiers","Traiteur","Boissons","Autre"].map(x=><option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="two-cols">
        <div className="field"><label htmlFor="product-price">Prix (€)</label><input id="product-price" required type="number" min="0.01" max="10000" step="0.01" value={form.priceEuros} onChange={e=>setForm({...form,priceEuros:e.target.value})} placeholder="3,90"/></div>
        <div className="field"><label htmlFor="product-unit">Unité de vente</label><input id="product-unit" required minLength={1} maxLength={30} value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="kg, pièce, botte…"/></div>
      </div>
      <div className="field"><label htmlFor="product-description">Description (facultatif)</label><textarea id="product-description" maxLength={500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Origine, variété, label, conseils…"/></div>
      <label style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 16, fontSize: 13 }}><input type="checkbox" checked={form.isAvailable} onChange={e=>setForm({...form,isAvailable:e.target.checked})}/>Disponible à la vente</label>
      {error && <p role="alert" style={{ color: "#b42318", fontSize: 13 }}>{error}</p>}
      {message && <p role="status" className="notice">{message}</p>}
      <button className="primary" type="submit" disabled={busy} style={{ marginTop: 18 }}><PackagePlus size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{busy ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter au catalogue"}</button>
    </form>
    <div style={{ display: "grid", gap: 10 }}>
      {products.map(product => <article className="panel" key={product.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: 20 }}>
        <div style={{ minWidth: 180, flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><strong>{product.name}</strong><span className="pill">{product.isAvailable ? "Disponible" : "Indisponible"}</span></div><p className="subtle" style={{ margin: "6px 0" }}>{product.category} · {product.unit} · {(product.priceCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</p>{product.description && <p className="subtle" style={{ margin: 0 }}>{product.description}</p>}</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button className="secondary" disabled={busy} onClick={()=>toggle(product)}>{product.isAvailable ? "Indisponible" : "Disponible"}</button><button className="secondary" disabled={busy} onClick={()=>beginEdit(product)} aria-label={"Modifier "+product.name}><Pencil size={15}/></button><button className="secondary" disabled={busy} onClick={()=>remove(product.id)} aria-label={"Supprimer "+product.name}><Trash2 size={15}/></button></div>
      </article>)}
      {products.length === 0 && <div className="panel"><p className="subtle">Votre catalogue est vide. Ajoutez votre premier produit pour préparer votre vitrine.</p></div>}
    </div>
  </div>;
}
