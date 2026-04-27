-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "cashOnDelivery" DOUBLE PRECISION,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "fromCity" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "toCity" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StatusHistory" ADD COLUMN     "location" TEXT;
