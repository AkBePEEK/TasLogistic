-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('AVIA', 'RAIL', 'TRUCK');

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "CarrierType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Carrier_city_idx" ON "Carrier"("city");

-- CreateIndex
CREATE INDEX "Carrier_type_idx" ON "Carrier"("type");
