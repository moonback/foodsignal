import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeRequest } from "@/lib/stripe";

const schema = z.object({ reason: z.string().trim().min(10).max(500) });
type StripeRefund = { id: string; status: string; amount: number };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès réservé à l'équipe FOOD SIGNAL." }, { status: 403 });

  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, totalCents: true, paymentStatus: true, stripePaymentIntentId: true },
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (order.paymentStatus !== "PAID" || !order.stripePaymentIntentId) {
      return NextResponse.json({ error: "Seule une commande intégralement payée peut être remboursée." }, { status: 409 });
    }

    const idempotencyKey = `foodsignal_full_refund_${order.id}`;
    let refund = await prisma.paymentRefund.findUnique({ where: { idempotencyKey } });
    if (refund?.status === "SUCCEEDED") return NextResponse.json({ error: "Cette commande est déjà remboursée." }, { status: 409 });
    if (refund?.status === "FAILED") return NextResponse.json({ error: "Une tentative de remboursement a échoué. Une vérification manuelle est nécessaire avant toute nouvelle tentative." }, { status: 409 });
    if (!refund) {
      refund = await prisma.paymentRefund.create({
        data: { orderId: order.id, idempotencyKey, amountCents: order.totalCents, reason: input.reason, requestedById: user.id },
      });
    }

    const result = await stripeRequest<StripeRefund>("/v1/refunds", "POST", new URLSearchParams({
      payment_intent: order.stripePaymentIntentId,
      reverse_transfer: "true",
      refund_application_fee: "true",
      "metadata[orderId]": order.id,
      "metadata[requestedBy]": user.id,
    }), idempotencyKey);
    await prisma.paymentRefund.update({
      where: { id: refund.id },
      data: { stripeRefundId: result.id, status: result.status === "succeeded" ? "SUCCEEDED" : "PENDING" },
    });
    if (result.status === "succeeded") {
      await prisma.order.updateMany({ where: { id: order.id, paymentStatus: "PAID" }, data: { paymentStatus: "REFUNDED" } });
    }
    return NextResponse.json({ refund: { id: result.id, status: result.status, amountCents: result.amount } }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Un motif de remboursement (10 à 500 caractères) est obligatoire." }, { status: 400 });
    console.error("POST /api/operator/orders/[id]/refund", error);
    return NextResponse.json({ error: "Impossible de créer le remboursement Stripe. Vérifiez le tableau de bord avant toute nouvelle tentative." }, { status: 502 });
  }
}
