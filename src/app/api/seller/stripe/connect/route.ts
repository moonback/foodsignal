import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, stripeRequest } from "@/lib/stripe";

type StripeAccount = {
  id: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  capabilities?: { transfers?: string };
};
type StripeAccountLink = { url: string; expires_at: number };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });
  const seller = await prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true, isActive: true, stripeAccountId: true } });
  if (!seller || !seller.isActive) return NextResponse.json({ error: "Votre établissement doit être validé avant de connecter Stripe." }, { status: 403 });
  if (!seller.stripeAccountId) return NextResponse.json({ connected: false, chargesEnabled: false, payoutsEnabled: false, transfersEnabled: false });

  try {
    const account = await stripeRequest<StripeAccount>(`/v1/accounts/${encodeURIComponent(seller.stripeAccountId)}`, "GET");
    const status = {
      stripeChargesEnabled: Boolean(account.charges_enabled),
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      stripeTransfersEnabled: account.capabilities?.transfers === "active",
    };
    await prisma.seller.update({ where: { id: seller.id }, data: status });
    return NextResponse.json({
      connected: true,
      accountId: account.id,
      chargesEnabled: status.stripeChargesEnabled,
      payoutsEnabled: status.stripePayoutsEnabled,
      transfersEnabled: status.stripeTransfersEnabled,
      ready: status.stripeTransfersEnabled && status.stripePayoutsEnabled,
    });
  } catch (error) {
    console.error("GET /api/seller/stripe/connect", error);
    return NextResponse.json({ error: "Impossible de vérifier le compte Stripe." }, { status: 502 });
  }
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Accès réservé aux professionnels." }, { status: 403 });

  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: user.id },
      select: { id: true, businessName: true, isActive: true, stripeAccountId: true, user: { select: { email: true } } },
    });
    if (!seller || !seller.isActive) return NextResponse.json({ error: "Votre établissement doit être validé avant de connecter Stripe." }, { status: 403 });

    let accountId = seller.stripeAccountId;
    if (!accountId) {
      const created = await stripeRequest<StripeAccount>("/v1/accounts", "POST", new URLSearchParams({
        type: "express",
        country: "FR",
        email: seller.user.email,
        "business_profile[name]": seller.businessName,
        "capabilities[transfers][requested]": "true",
        "metadata[food_signal_seller_id]": seller.id,
      }), `foodsignal_seller_account_${seller.id}`);
      accountId = created.id;
      await prisma.seller.updateMany({ where: { id: seller.id, stripeAccountId: null }, data: { stripeAccountId: accountId } });
      const latest = await prisma.seller.findUnique({ where: { id: seller.id }, select: { stripeAccountId: true } });
      accountId = latest?.stripeAccountId || accountId;
    }

    const base = appBaseUrl();
    const link = await stripeRequest<StripeAccountLink>("/v1/account_links", "POST", new URLSearchParams({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${base}/vendeur?stripe=refresh`,
      return_url: `${base}/vendeur?stripe=return`,
    }));
    return NextResponse.json({ url: link.url, expiresAt: link.expires_at });
  } catch (error) {
    if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") return NextResponse.json({ error: "La connexion Stripe n'est pas encore configurée par FOOD SIGNAL." }, { status: 503 });
    console.error("POST /api/seller/stripe/connect", error);
    return NextResponse.json({ error: "Impossible de démarrer l'inscription Stripe. Vérifiez la configuration de la plateforme." }, { status: 502 });
  }
}
