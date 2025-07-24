/*
  Warnings:

  - The `currency` column on the `Account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[account_name]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_name` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'RUB', 'ZAR', 'IDR', 'SGD', 'NZD', 'MXN', 'KRW', 'SEK', 'NOK', 'DKK');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "account_name" VARCHAR(50) NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE UNIQUE INDEX "Account_account_name_key" ON "Account"("account_name");
