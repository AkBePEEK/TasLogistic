-- CreateTable
CREATE TABLE "TrackedItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackedItem_customerId_idx" ON "TrackedItem"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedItem_customerId_itemId_key" ON "TrackedItem"("customerId", "itemId");

-- AddForeignKey
ALTER TABLE "TrackedItem" ADD CONSTRAINT "TrackedItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedItem" ADD CONSTRAINT "TrackedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
