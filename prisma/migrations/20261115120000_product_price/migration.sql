-- Add explicit product pricing and modification timestamps.
ALTER TABLE "Product" ADD COLUMN "priceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Product" ALTER COLUMN "priceCents" DROP DEFAULT;
CREATE INDEX "Product_sellerId_isAvailable_idx" ON "Product"("sellerId", "isAvailable");
