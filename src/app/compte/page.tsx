"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Leaf, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = mode === "register"
      ? { name: form.get("name"), email: form.get("email"), password: form.get("password") }
      : { email: form.get("email"), password: form.get("password") };
    try {
      const response = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Une erreur est survenue.");
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="shell" style={{ maxWidth: 620, paddingTop: 36, paddingBottom: 80 }}>
    <Link className="brand" href="/"><span className="brand-mark"><Leaf size={19}/></span>FOOD SIGNAL</Link>
    <div className="panel" style={{ marginTop: 28 }}>
      <Link className="secondary" href="/" style={{ textDecoration: "none" }}><ArrowLeft size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Accueil</Link>
      <div className="eyebrow" style={{ marginTop: 28 }}><ShieldCheck size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Compte sécurisé</div>
      <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)", margin: "12px 0" }}>{mode === "register" ? "Créez votre compte." : "Ravi de vous revoir."}</h1>
      <p className="subtle">Un compte personnel permet de retrouver vos demandes et de protéger vos coordonnées.</p>
      <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
        <button type="button" className={mode === "register" ? "primary" : "secondary"} onClick={() => { setMode("register"); setError(""); }}>Créer un compte</button>
        <button type="button" className={mode === "login" ? "primary" : "secondary"} onClick={() => { setMode("login"); setError(""); }}>Se connecter</button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && <div className="field"><label htmlFor="name">Nom et prénom</label><input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name"/></div>}
        <div className="field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email"/></div>
        <div className="field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" required minLength={mode === "register" ? 12 : 1} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"}/>{mode === "register" && <span className="subtle" style={{ fontSize: 12 }}>12 caractères minimum.</span>}</div>
        {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
        <button className="primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 16 }}>{busy ? "Veuillez patienter…" : mode === "register" ? "Créer mon compte" : "Me connecter"}</button>
      </form>
      <p className="subtle" style={{ fontSize: 11, marginTop: 18 }}>En créant un compte, vous pourrez déposer des demandes. L’inscription ne déclenche aucun achat ni contact automatique avec un commerçant.</p>
    </div>
  </main>;
}
