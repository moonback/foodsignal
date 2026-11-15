CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

ALTER TABLE "Seller"
  ADD COLUMN "stripeAccountId" TEXT,
  ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stripeTransfersEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Seller_stripeAccountId_key" ON "Seller"("stripeAccountId");
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
