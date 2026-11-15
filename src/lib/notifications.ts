import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

type OrderNotification = {
  orderId: string;
  eventKey: string;
  type: NotificationType;
  title: string;
  message: string;
  includeOperators?: boolean;
};

export async function notifyOrderUsers(input: OrderNotification) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        demand: {
          select: {
            customerId: true,
            offers: {
              where: { status: "ACCEPTED" },
              select: { seller: { select: { userId: true } } },
              take: 1,
            },
          },
        },
      },
    });
    if (!order) return;
    const recipients = new Map<string, string>();
    if (order.demand.customerId) recipients.set(order.demand.customerId, `/commandes/${order.id}`);
    const sellerUserId = order.demand.offers[0]?.seller.userId;
    if (sellerUserId) recipients.set(sellerUserId, "/vendeur");
    if (input.includeOperators) {
      const operators = await prisma.user.findMany({ where: { role: "OPERATOR" }, select: { id: true } });
      operators.forEach(operator => recipients.set(operator.id, "/operateur"));
    }
    if (recipients.size === 0) return;
    await prisma.notification.createMany({
      data: [...recipients].map(([userId, href]) => ({
        userId, href,
        type: input.type,
        title: input.title,
        message: input.message,
        eventKey: `${order.id}:${input.eventKey}`,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    // Notification delivery must never roll back an order or make Stripe retry a
    // successfully processed payment event.
    console.error("notifyOrderUsers", error);
  }
}
