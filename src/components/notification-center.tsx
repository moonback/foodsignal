"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

type NotificationItem = {
  id: string; type: string; title: string; message: string; href: string;
  readAt: string | null; createdAt: string;
};

export default function NotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
      setError("");
    } catch {
      setError("Notifications indisponibles.");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markRead(id?: string) {
    const response = await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    if (response.ok) await load();
  }

  return <div style={{ position: "relative" }}>
    <button type="button" className="secondary" aria-label={`Notifications, ${unread} non lues`} aria-expanded={open} onClick={() => { setOpen(value => !value); if (!open) void load(); }}>
      <Bell size={16} style={{ verticalAlign: "middle", marginRight: 6 }}/>Notifications
      {unread > 0 && <span style={{ marginLeft: 7, borderRadius: 99, padding: "2px 7px", background: "#b42318", color: "white", fontSize: 11 }}>{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <div role="dialog" aria-label="Centre de notifications" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 30, width: "min(360px, calc(100vw - 32px))", maxHeight: 420, overflowY: "auto", background: "white", color: "#24332b", border: "1px solid #dfe7e1", borderRadius: 14, boxShadow: "0 14px 40px rgba(20,40,25,.16)", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <strong>Vos notifications</strong>
        <button type="button" className="secondary" disabled={unread === 0} onClick={() => void markRead()}><CheckCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }}/>Tout lire</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 && <p className="subtle">Aucune notification pour le moment.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {items.map(item => <Link key={item.id} href={item.href} onClick={() => { if (!item.readAt) void markRead(item.id); setOpen(false); }} style={{ display: "block", textDecoration: "none", color: "inherit", background: item.readAt ? "#f7f9f7" : "#edf6ef", borderRadius: 10, padding: 10, border: "1px solid #e5ece6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ fontSize: 13 }}>{item.title}</strong>{!item.readAt && <span aria-label="Non lue" style={{ width: 7, height: 7, flex: "0 0 7px", borderRadius: 99, background: "#16834a", marginTop: 5 }}/>}</div>
          <p style={{ margin: "5px 0", fontSize: 12, lineHeight: 1.45 }}>{item.message}</p>
          <span className="subtle" style={{ fontSize: 11 }}>{new Date(item.createdAt).toLocaleString("fr-FR")} <ExternalLink size={10} style={{ verticalAlign: "middle" }}/></span>
        </Link>)}
      </div>
    </div>}
  </div>;
}
