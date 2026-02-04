-- CreateTable
CREATE TABLE "RecipePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "priceRsd" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipePurchase_userId_idx" ON "RecipePurchase"("userId");

-- CreateIndex
CREATE INDEX "RecipePurchase_recipeId_idx" ON "RecipePurchase"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipePurchase_userId_recipeId_key" ON "RecipePurchase"("userId", "recipeId");

-- AddForeignKey
ALTER TABLE "RecipePurchase" ADD CONSTRAINT "RecipePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePurchase" ADD CONSTRAINT "RecipePurchase_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
