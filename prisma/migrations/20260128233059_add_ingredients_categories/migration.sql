/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_categoryId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "categoryId" TEXT;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "CategoryRecipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoryRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoryIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryRecipe_name_key" ON "CategoryRecipe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryIngredient_name_key" ON "CategoryIngredient"("name");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryRecipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
