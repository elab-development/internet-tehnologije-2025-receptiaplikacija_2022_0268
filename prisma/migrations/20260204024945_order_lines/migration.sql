/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `name` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `address` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalRsd` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotalRsd` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qty` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPriceRsd` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'CARD');

-- DropIndex
DROP INDEX "Order_userId_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "totalRsd" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "name",
DROP COLUMN "quantity",
DROP COLUMN "unit",
ADD COLUMN     "kind" TEXT NOT NULL,
ADD COLUMN     "lineTotalRsd" INTEGER NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "qty" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "unitPriceRsd" INTEGER NOT NULL;
