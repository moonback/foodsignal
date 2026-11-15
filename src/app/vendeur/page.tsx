import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Store, Clock3, Package, MapPin } from "lucide-react";

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/compte?next=%2Fvendeur");
  if (user.role !== "SELLER") redirect("/vendeur/inscription");

  const seller = await prisma.seller.findUnique({
    where: { userId: user.id },
    select: { businessName: true, city: true, isActive: true, specialties: true },
  });
  if (!seller) redirect("/");

  return <main className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
    <header className="topbar" style={{ padding: "0 0 28px" }}>
      <Link className="brand" href="/"><span className="brand-mark"><Store size={19}/></span>FOOD SIGNAL</Link>
      <Link className="secondary" href="/">Retour à l’accueil</Link>
    </header>
    <div className="eyebrow">Espace professionnel</div>
    <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)", margin: "12px 0" }}>Bonjour, {seller.businessName}.</h1>
    <p className="subtle">Votre espace commerçant est créé. Les fonctionnalités de réception des demandes et de réponse aux besoins arrivent dans le prochain lot.</p>
    <div className="request-layout" style={{ marginTop: 28 }}>
      <section className="panel">
        <div className="eyebrow">Statut du compte</div>
        <h3 style={{ marginTop: 12 }}>{seller.isActive ? "Compte actif" : "Vérification en attente"}</h3>
        <p className="subtle">{seller.isActive ? "Votre établissement est activé." : "Votre profil est enregistré mais ne reçoit pas encore de demandes. Une validation opérateur sera nécessaire."}</p>
        <div className="notice"><Clock3 size={17} style={{ verticalAlign: "middle", marginRight: 7 }}/>{seller.isActive ? "Vous serez informé de l’ouverture du matching." : "Aucune demande client ne vous est transmise à ce stade."}</div>
      </section>
      <section className="panel">
        <div className="eyebrow">Votre établissement</div>
        <h3 style={{ marginTop: 12 }}>{seller.businessName}</h3>
        <p className="subtle"><MapPin size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{seller.city}</p>
        <p className="subtle"><Package size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>Spécialités : {seller.specialties.join(", ")}</p>
      </section>
    </div>
  </main>;
}
