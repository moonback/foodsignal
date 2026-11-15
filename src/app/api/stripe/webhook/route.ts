import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOrderUsers } from "@/lib/notifications";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map(part => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest();
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

type StripeObject = Record<string, unknown>;
function metadataOrderId(object: StripeObject) {
  const metadata = object.metadata;
  if (typeof metadata !== "object" || metadata === null) return null;
  const id = (metadata as Record<string, unknown>).orderId;
  return typeof id === "string" ? id : null;
}
function stripeDisputeStatus(value: unknown) {
  const allowed = ["WARNING_NEEDS_RESPONSE", "WARNING_UNDER_REVIEW", "WARNING_CLOSED", "NEEDS_RESPONSE", "UNDER_REVIEW", "WON", "LOST"] as const;
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  return (allowed as readonly string[]).includes(normalized) ? normalized : "UNDER_REVIEW";
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook Stripe non configuré." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });

  try {
    const event = JSON.parse(rawBody) as { type: string; data?: { object?: StripeObject } };
    const object = event.data?.object;
    if (!object || typeof object.id !== "string") return NextResponse.json({ received: true });

    if (event.type.startsWith("charge.dispute.")) {
      const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
      if (!paymentIntent) return NextResponse.json({ received: true });
      const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntent }, select: { id: true } });
      if (!order) return NextResponse.json({ received: true });
      const status = stripeDisputeStatus(object.status);
      await prisma.stripeDispute.upsert({
        where: { stripeDisputeId: object.id },
        create: {
          stripeDisputeId: object.id, orderId: order.id, status,
          amountCents: typeof object.amount === "number" ? object.amount : 0,
          currency: typeof object.currency === "string" ? object.currency : "eur",
          reason: typeof object.reason === "string" ? object.reason : "unknown",
        },
        update: { status, amountCents: typeof object.amount === "number" ? object.amount : 0, reason: typeof object.reason === "string" ? object.reason : "unknown" },
      });
      await notifyOrderUsers({
        orderId: order.id, eventKey: `dispute-${object.id}`, type: "DISPUTE_OPENED",
        title: "Litige de paiement signalé", message: "Un litige Stripe concerne cette commande. L'équipe FOOD SIGNAL doit examiner le dossier.",
        includeOperators: true,
      });
      return NextResponse.json({ received: true });
    }

    if (event.type === "refund.created" || event.type === "refund.updated" || event.type === "refund.failed") {
      const orderId = metadataOrderId(object);
      if (orderId) {
        const status = object.status === "succeeded" ? "SUCCEEDED" : object.status === "failed" ? "FAILED" : "PENDING";
        await prisma.paymentRefund.updateMany({
          where: { orderId, OR: [{ stripeRefundId: object.id }, { stripeRefundId: null }] },
          data: { stripeRefundId: object.id, status },
        });
        if (status === "SUCCEEDED") {
          await prisma.order.updateMany({ where: { id: orderId, paymentStatus: "PAID" }, data: { paymentStatus: "REFUNDED" } });
        }
        await notifyOrderUsers({
          orderId, eventKey: `refund-${object.id}-${status.toLowerCase()}`, type: "REFUND_UPDATED",
          title: status === "SUCCEEDED" ? "Remboursement effectué" : status === "FAILED" ? "Échec du remboursement" : "Remboursement en cours",
          message: status === "SUCCEEDED" ? "Le remboursement de votre commande a été confirmé." : status === "FAILED" ? "Le remboursement n'a pas abouti. L'équipe FOOD SIGNAL vérifie la situation." : "Votre demande de remboursement est en cours de traitement.",
          includeOperators: true,
        });
      }
      return NextResponse.json({ received: true });
    }

    const orderId = metadataOrderId(object);
    if (!orderId) return NextResponse.json({ received: true });

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (object.payment_status !== "paid") return NextResponse.json({ received: true });
      const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
      const paid = await prisma.order.updateMany({
        where: { id: orderId, stripeCheckoutSessionId: object.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "PAID", stripePaymentIntentId: paymentIntent, paidAt: new Date() },
      });
      if (paid.count === 1) await notifyOrderUsers({
        orderId, eventKey: "payment-received", type: "PAYMENT_RECEIVED",
        title: "Paiement confirmé", message: "Le paiement de votre commande a été confirmé par Stripe.",
      });
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      await prisma.order.updateMany({
        where: { id: orderId, stripeCheckoutSessionId: object.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED" },
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/stripe/webhook", error);
    return NextResponse.json({ error: "Traitement du webhook impossible." }, { status: 500 });
  }
}
