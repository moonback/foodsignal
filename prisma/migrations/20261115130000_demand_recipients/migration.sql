CREATE TABLE "DemandRecipient" (
  "id" TEXT NOT NULL,
  "demandId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemandRecipient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DemandRecipient_demandId_sellerId_key" ON "DemandRecipient"("demandId", "sellerId");
CREATE INDEX "DemandRecipient_sellerId_createdAt_idx" ON "DemandRecipient"("sellerId", "createdAt");
ALTER TABLE "DemandRecipient" ADD CONSTRAINT "DemandRecipient_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandRecipient" ADD CONSTRAINT "DemandRecipient_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
