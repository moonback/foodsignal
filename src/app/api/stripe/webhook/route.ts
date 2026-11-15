import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook Stripe non configuré." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });

  try {
    const event = JSON.parse(rawBody) as { type: string; data?: { object?: Record<string, unknown> } };
    const session = event.data?.object;
    if (!session || typeof session.id !== "string") return NextResponse.json({ received: true });
    const orderId = typeof session.metadata === "object" && session.metadata !== null
      ? (session.metadata as Record<string, unknown>).orderId
      : null;
    if (typeof orderId !== "string") return NextResponse.json({ received: true });

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (session.payment_status !== "paid") return NextResponse.json({ received: true });
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
      await prisma.order.updateMany({
        where: { id: orderId, stripeCheckoutSessionId: session.id as string, paymentStatus: "PENDING" },
        data: { paymentStatus: "PAID", stripePaymentIntentId: paymentIntent, paidAt: new Date() },
      });
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      await prisma.order.updateMany({
        where: { id: orderId, stripeCheckoutSessionId: session.id as string, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED" },
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/stripe/webhook", error);
    return NextResponse.json({ error: "Traitement du webhook impossible." }, { status: 500 });
  }
}
