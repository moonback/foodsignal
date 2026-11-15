"use client";

import { useState, type FormEvent } from "react";

export default function ClarificationForm({ demandId, questions }: { demandId: string; questions: string }) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/demands/${demandId}/clarification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible d'enregistrer la précision.");
      setMessage(payload.demand.status === "DRAFT"
        ? "Merci. Votre demande est maintenant complète et prête pour la vérification opérateur."
        : "Merci. Une précision supplémentaire est nécessaire : consultez les questions mises à jour après actualisation.");
      setAnswer("");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="notice" style={{ marginTop: 14 }}>
    <strong>Quelques précisions sont nécessaires</strong>
    <p style={{ whiteSpace: "pre-line", margin: "8px 0" }}>{questions}</p>
    <label htmlFor={`clarification-${demandId}`} style={{ display: "block", fontWeight: 700, marginBottom: 7 }}>Votre réponse</label>
    <textarea id={`clarification-${demandId}`} value={answer} onChange={event => setAnswer(event.target.value)} maxLength={1000} minLength={2} required placeholder="Ex. : 2 kg de pommes ; 1 pièce de pain. Ne répondez pas seulement par le nombre de convives." style={{ width: "100%", minHeight: 82, border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "white" }}/>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    {message && <p role="status">{message}</p>}
    <button className="primary" disabled={busy || answer.trim().length < 2} style={{ marginTop: 10 }}>{busy ? "Analyse…" : "Envoyer mes précisions"}</button>
  </form>;
}
