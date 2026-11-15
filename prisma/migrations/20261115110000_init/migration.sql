-- Initial FOOD SIGNAL relational model.
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SELLER', 'OPERATOR');
CREATE TYPE "DemandStatus" AS ENUM ('DRAFT', 'ANALYZING', 'NEEDS_CLARIFICATION', 'OPEN', 'COLLECTING_OFFERS', 'PROPOSAL_READY', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "FulfillmentMode" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Seller" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "description" TEXT,
  "specialties" TEXT[] NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "description" TEXT,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Demand" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "rawDescription" TEXT NOT NULL,
  "anonymizedBrief" TEXT NOT NULL,
  "structuredNeed" JSONB,
  "budgetMaxCents" INTEGER,
  "requestedAt" TIMESTAMP(3),
  "fulfillmentMode" "FulfillmentMode",
  "city" TEXT NOT NULL,
  "postalCode" TEXT,
  "status" "DemandStatus" NOT NULL DEFAULT 'ANALYZING',
  "clarification" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "demandId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "preparationCents" INTEGER NOT NULL DEFAULT 0,
  "deliveryCents" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "fulfillmentModes" "FulfillmentMode"[] NOT NULL,
  "availableAt" TIMESTAMP(3),
  "status" "OfferStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "demandId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
  "fulfillmentMode" "FulfillmentMode" NOT NULL,
  "deliveryAddress" TEXT,
  "totalCents" INTEGER NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");
CREATE INDEX "Product_sellerId_category_idx" ON "Product"("sellerId", "category");
CREATE INDEX "Demand_status_city_createdAt_idx" ON "Demand"("status", "city", "createdAt");
CREATE UNIQUE INDEX "Offer_demandId_sellerId_key" ON "Offer"("demandId", "sellerId");
CREATE UNIQUE INDEX "Order_demandId_key" ON "Order"("demandId");

ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
