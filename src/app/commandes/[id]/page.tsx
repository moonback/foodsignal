import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, MapPin, Package, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrderPayment from "./order-payment";

const labels: Record<string, string> = {
  CONFIRMED: "Commande confirmée",
  PREPARING: "En préparation",
  READY: "Prête au retrait",
  OUT_FOR_DELIVERY: "En cours de livraison",
  COMPLETED: "Commande terminée",
  CANCELLED: "Commande annulée",
};
function euro(cents: number) { return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte");
  if (user.role !== "CUSTOMER") redirect("/");
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, demand: { customerId: user.id } },
    select: {
      id: true, status: true, paymentStatus: true, fulfillmentMode: true, deliveryAddress: true,
      totalCents: true, confirmedAt: true, updatedAt: true,
      demand: {
        select: {
          city: true, anonymizedBrief: true,
          offers: { where: { status: "ACCEPTED" }, select: {
            items: true, subtotalCents: true, preparationCents: true, deliveryCents: true,
            seller: { select: { businessName: true, city: true } },
          }},
        },
      },
    },
  });
  if (!order) notFound();
  const offer = order.demand.offers[0];
  const items = offer && Array.isArray(offer.items) ? offer.items : [];
  return <main className="shell" style={{ paddingTop: 42, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 24px" }}><Link className="brand" href="/"><span className="brand-mark"><Package size={19}/></span>FOOD SIGNAL</Link><Link className="secondary" href="/mes-demandes"><ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>Mes demandes</Link></header>
    <div className="eyebrow">Suivi de commande</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Votre commande</h1>
    <section className="panel" style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><div className="eyebrow">Référence</div><strong>{order.id}</strong></div><span className="pill">{labels[order.status] || order.status}</span></div>
      <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
        {["CONFIRMED","PREPARING",...(order.fulfillmentMode === "DELIVERY" ? ["OUT_FOR_DELIVERY"] : ["READY"]),"COMPLETED"].map((status, index) => {
          const states = ["CONFIRMED","PREPARING",order.fulfillmentMode === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY","COMPLETED"];
          const activeIndex = states.indexOf(order.status);
          const reached = index <= activeIndex;
          return <div key={status} style={{ display: "flex", gap: 10, alignItems: "center", color: reached ? "#1e6b4b" : "#849188" }}><CheckCircle2 size={18}/><span>{labels[status] || (status === "READY" ? "Prête au retrait" : status)}</span></div>;
        })}
      </div>
      <p className="subtle" style={{ marginTop: 18 }}><Clock3 size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>Confirmée le {order.confirmedAt.toLocaleString("fr-FR")} · Mise à jour le {order.updatedAt.toLocaleString("fr-FR")}</p>
    </section>
    <OrderPayment orderId={order.id} paymentStatus={order.paymentStatus} orderStatus={order.status}/>
    <section className="panel" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 20 }}>Votre commerçant</h2>
      {offer && <p><Store size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/><strong>{offer.seller.businessName}</strong> · {offer.seller.city}</p>}
      <p className="subtle"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{order.fulfillmentMode === "DELIVERY" ? order.deliveryAddress : "Retrait chez le commerçant"}</p>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 14 }}>
        <h3>Récapitulatif</h3>
        {items.map((raw, index) => {
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
          const item = raw as Record<string, unknown>;
          return <div className="signal-line" key={index}><span>{String(item.name)} × {String(item.quantity)} {String(item.unit)}</span><strong>{euro(Number(item.quantity) * Number(item.unitPriceCents) || 0)}</strong></div>;
        })}
        {offer && <><div className="signal-line"><span>Produits</span><strong>{euro(offer.subtotalCents)}</strong></div><div className="signal-line"><span>Préparation</span><strong>{euro(offer.preparationCents)}</strong></div>{order.fulfillmentMode === "DELIVERY" && <div className="signal-line"><span>Livraison</span><strong>{euro(offer.deliveryCents)}</strong></div>}</>}
        <div className="signal-line" style={{ fontSize: 18, marginTop: 10 }}><strong>Total confirmé</strong><strong>{euro(order.totalCents)}</strong></div>
      </div>
    </section>
  </main>;
}
