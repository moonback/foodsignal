import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, platformFeeAmount, stripeRequest } from "@/lib/stripe";

type CheckoutSession = { id: string; url: string | null; status?: string; payment_status?: string };

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Accès réservé aux clients." }, { status: 403 });

  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, demand: { customerId: user.id } },
      select: {
        id: true, totalCents: true, status: true, paymentStatus: true, stripeCheckoutSessionId: true,
        demand: { select: { offers: { where: { status: "ACCEPTED" }, select: {
          seller: { select: { businessName: true, stripeAccountId: true, stripeTransfersEnabled: true, stripePayoutsEnabled: true } },
        } } } },
      },
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Cette commande est déjà payée." }, { status: 409 });
    if (order.status !== "CONFIRMED") return NextResponse.json({ error: "Le paiement doit être effectué avant le début de la préparation." }, { status: 409 });

    const seller = order.demand.offers[0]?.seller;
    if (!seller?.stripeAccountId || !seller.stripeTransfersEnabled || !seller.stripePayoutsEnabled) {
      return NextResponse.json({ error: "Le commerçant n'a pas terminé la configuration de ses paiements Stripe." }, { status: 409 });
    }

    if (order.stripeCheckoutSessionId) {
      const existing = await stripeRequest<CheckoutSession>(`/v1/checkout/sessions/${encodeURIComponent(order.stripeCheckoutSessionId)}`, "GET");
      if (existing.status === "open" && existing.url) return NextResponse.json({ url: existing.url });
      if (existing.payment_status === "paid") return NextResponse.json({ error: "Paiement en cours de synchronisation. Actualisez la commande." }, { status: 409 });
    }

    const fee = platformFeeAmount(order.totalCents);
    if (fee >= order.totalCents) return NextResponse.json({ error: "La commission configurée dépasse le montant de la commande." }, { status: 500 });
    const base = appBaseUrl();
    const params = new URLSearchParams({
      mode: "payment",
      success_url: `${base}/commandes/${order.id}?paiement=retour`,
      cancel_url: `${base}/commandes/${order.id}?paiement=annule`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": String(order.totalCents),
      "line_items[0][price_data][product_data][name]": `Commande FOOD SIGNAL ${order.id.slice(-8).toUpperCase()} — ${seller.businessName}`,
      "payment_intent_data[transfer_data][destination]": seller.stripeAccountId,
      "payment_intent_data[metadata][orderId]": order.id,
      "metadata[orderId]": order.id,
      "metadata[customerId]": user.id,
    });
    if (fee > 0) params.set("payment_intent_data[application_fee_amount]", String(fee));

    const session = await stripeRequest<CheckoutSession>("/v1/checkout/sessions", "POST", params, `foodsignal_order_checkout_${order.id}`);
    if (!session.url) return NextResponse.json({ error: "Stripe n'a pas retourné d'URL de paiement." }, { status: 502 });
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "PENDING" },
      data: { stripeCheckoutSessionId: session.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && ["STRIPE_NOT_CONFIGURED", "PLATFORM_FEE_NOT_CONFIGURED", "PLATFORM_FEE_INVALID", "APP_URL_NOT_CONFIGURED"].includes(error.message)) {
      return NextResponse.json({ error: "Les paramètres Stripe et le taux de commission doivent être configurés par FOOD SIGNAL avant d'activer le paiement." }, { status: 503 });
    }
    console.error("POST /api/orders/[id]/checkout", error);
    return NextResponse.json({ error: "Impossible de préparer le paiement sécurisé." }, { status: 502 });
  }
}
