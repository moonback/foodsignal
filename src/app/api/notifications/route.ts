import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ id: z.string().min(1).optional(), all: z.boolean().optional() }).refine(value => Boolean(value.id) !== Boolean(value.all));

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, message: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return NextResponse.json({
    notifications: notifications.map(item => ({ ...item, readAt: item.readAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })),
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  try {
    const input = updateSchema.parse(await request.json());
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(input.id ? { id: input.id } : {}) },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    console.error("PATCH /api/notifications", error);
    return NextResponse.json({ error: "Impossible de mettre à jour les notifications." }, { status: 500 });
  }
}
