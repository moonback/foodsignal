import { prisma } from "@/lib/prisma";

export async function writeOperatorAudit(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, string | number | boolean | null>;
}) {
  await prisma.operatorAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details,
    },
  });
}
