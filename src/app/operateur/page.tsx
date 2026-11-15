import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, MapPin, Package, Store, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerReviewActions from "./seller-review-actions";
import DemandDistributionPanel from "./demand-distribution-panel";
import OperatorPaymentsDashboard from "./operator-payments-dashboard";
import NotificationCenter from "@/components/notification-center";

export default async function OperatorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/compte?next=%2Foperateur");
  if (user.role !== "OPERATOR") redirect("/");

  const sellers = await prisma.seller.findMany({
    orderBy: [{ isActive: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, businessName: true, description: true, specialties: true, address: true,
      city: true, postalCode: true, isActive: true, createdAt: true,
      user: { select: { name: true, email: true } },
      _count: { select: { products: true } },
    },
  });
  const pending = sellers.filter(seller => !seller.isActive).length;
  const paymentOrders = await prisma.order.findMany({
    orderBy: { updatedAt: "desc" }, take: 100,
    select: {
      id: true, status: true, paymentStatus: true, fulfillmentMode: true,
      totalCents: true, paidAt: true, updatedAt: true,
      demand: { select: { city: true, customerName: true, offers: { where: { status: "ACCEPTED" }, select: { seller: { select: { businessName: true } } }, take: 1 } } },
      refunds: { orderBy: { createdAt: "desc" }, select: { id: true, stripeRefundId: true, amountCents: true, status: true, reason: true, createdAt: true } },
      disputes: { orderBy: { updatedAt: "desc" }, select: { id: true, stripeDisputeId: true, status: true, amountCents: true, currency: true, reason: true, updatedAt: true } },
    },
  });
  const initialPaymentOrders = paymentOrders.map(order => ({
    ...order,
    paidAt: order.paidAt?.toISOString() ?? null,
    updatedAt: order.updatedAt.toISOString(),
    refunds: order.refunds.map(refund => ({ ...refund, createdAt: refund.createdAt.toISOString() })),
    disputes: order.disputes.map(dispute => ({ ...dispute, updatedAt: dispute.updatedAt.toISOString() })),
  }));
  return <main className="shell" style={{ paddingTop: 42, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 24px" }}>
      <Link className="brand" href="/"><span className="brand-mark"><Store size={19}/></span>FOOD SIGNAL</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><NotificationCenter/><span className="pill">Console opérateur</span></div>
    </header>
    <div className="eyebrow">Administration du réseau</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Validation des commerçants</h1>
    <p className="subtle">Vérifiez l'identité et les informations de chaque établissement avant d'activer son accès au futur matching.</p>
    <div className="request-layout" style={{ marginTop: 24 }}>
      <div className="panel"><div className="eyebrow">En attente</div><h2 style={{ fontSize: 38, margin: "8px 0" }}>{pending}</h2><p className="subtle">Profil(s) à examiner</p><Clock3 color="#b7791f"/></div>
      <div className="panel"><div className="eyebrow">Commerçants actifs</div><h2 style={{ fontSize: 38, margin: "8px 0" }}>{sellers.length - pending}</h2><p className="subtle">Profil(s) validé(s)</p><CheckCircle2 color="#1e6b4b"/></div>
    </div>
    <DemandDistributionPanel />
    <OperatorPaymentsDashboard initialOrders={initialPaymentOrders} />
    <div className="section-heading" style={{ marginTop: 30 }}><div><div className="eyebrow">Réseau local</div><h2>Commerçants</h2></div></div>
    <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
      {sellers.map(seller => <article className="panel" key={seller.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div><div className="eyebrow">{seller.isActive ? "Actif" : "À vérifier"}</div><h3 style={{ marginTop: 8 }}>{seller.businessName}</h3><p className="subtle">{seller.user.name} · {seller.user.email}</p></div>
          <span className="pill">{seller.isActive ? "Validé" : "En attente"}</span>
        </div>
        {seller.description && <p className="subtle">{seller.description}</p>}
        <p className="subtle"><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{seller.address}, {seller.postalCode} {seller.city}</p>
        <p className="subtle"><Store size={14} style={{ verticalAlign: "middle", marginRight: 5 }}/>{seller.specialties.join(" · ")} <span style={{ marginLeft: 10 }}><Package size={14} style={{ verticalAlign: "middle" }}/> {seller._count.products} produit(s)</span></p>
        <SellerReviewActions sellerId={seller.id} isActive={seller.isActive}/>
      </article>)}
      {sellers.length === 0 && <div className="panel"><p className="subtle">Aucun professionnel inscrit pour le moment.</p></div>}
    </div>
  </main>;
}
