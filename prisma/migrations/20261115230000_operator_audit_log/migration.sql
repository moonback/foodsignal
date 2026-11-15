CREATE TABLE "OperatorAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperatorAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatorAuditLog_createdAt_idx" ON "OperatorAuditLog"("createdAt");
CREATE INDEX "OperatorAuditLog_actorId_createdAt_idx" ON "OperatorAuditLog"("actorId", "createdAt");
CREATE INDEX "OperatorAuditLog_entityType_entityId_createdAt_idx" ON "OperatorAuditLog"("entityType", "entityId", "createdAt");

ALTER TABLE "OperatorAuditLog" ADD CONSTRAINT "OperatorAuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
