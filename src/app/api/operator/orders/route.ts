import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "OPERATOR") return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });

  try {
    const orders = await prisma.order.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true, status: true, paymentStatus: true, fulfillmentMode: true,
        totalCents: true, paidAt: true, updatedAt: true,
        demand: {
          select: {
            city: true, customerName: true,
            offers: {
              where: { status: "ACCEPTED" },
              select: { seller: { select: { businessName: true } } },
              take: 1,
            },
          },
        },
        refunds: {
          orderBy: { createdAt: "desc" },
          select: { id: true, stripeRefundId: true, amountCents: true, status: true, reason: true, createdAt: true },
        },
        disputes: {
          orderBy: { updatedAt: "desc" },
          select: { id: true, stripeDisputeId: true, status: true, amountCents: true, currency: true, reason: true, updatedAt: true },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        paidAt: order.paidAt?.toISOString() ?? null,
        updatedAt: order.updatedAt.toISOString(),
        refunds: order.refunds.map(refund => ({ ...refund, createdAt: refund.createdAt.toISOString() })),
        disputes: order.disputes.map(dispute => ({ ...dispute, updatedAt: dispute.updatedAt.toISOString() })),
      })),
    });
  } catch (error) {
    console.error("GET /api/operator/orders", error);
    return NextResponse.json({ error: "Impossible de charger les paiements." }, { status: 500 });
  }
}
