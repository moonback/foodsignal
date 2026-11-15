CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "StripeDisputeStatus" AS ENUM ('WARNING_NEEDS_RESPONSE', 'WARNING_UNDER_REVIEW', 'WARNING_CLOSED', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST');

CREATE TABLE "PaymentRefund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "stripeRefundId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StripeDispute" (
  "id" TEXT NOT NULL,
  "stripeDisputeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "StripeDisputeStatus" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeDispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentRefund_stripeRefundId_key" ON "PaymentRefund"("stripeRefundId");
CREATE UNIQUE INDEX "PaymentRefund_idempotencyKey_key" ON "PaymentRefund"("idempotencyKey");
CREATE INDEX "PaymentRefund_orderId_status_idx" ON "PaymentRefund"("orderId", "status");
CREATE UNIQUE INDEX "StripeDispute_stripeDisputeId_key" ON "StripeDispute"("stripeDisputeId");
CREATE INDEX "StripeDispute_orderId_status_idx" ON "StripeDispute"("orderId", "status");

ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StripeDispute" ADD CONSTRAINT "StripeDispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
