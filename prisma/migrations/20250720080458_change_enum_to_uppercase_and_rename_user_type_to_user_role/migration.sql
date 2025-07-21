/*
  Warnings:

  - The values [active,inactive,suspended] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,completed,failed,reversed] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [deposit,withdrawal,transfer] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `user_type` on the `User` table. All the data in the column will be lost.
  - Added the required column `user_role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
ALTER TABLE "Account" ALTER COLUMN "account_status" DROP DEFAULT;
ALTER TABLE "Account" ALTER COLUMN "account_status" TYPE "AccountStatus_new" USING ("account_status"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "AccountStatus_old";
ALTER TABLE "Account" ALTER COLUMN "account_status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
ALTER TABLE "Transaction" ALTER COLUMN "transaction_status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "transaction_status" TYPE "TransactionStatus_new" USING ("transaction_status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
ALTER TABLE "Transaction" ALTER COLUMN "transaction_status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER');
ALTER TABLE "Transaction" ALTER COLUMN "transaction_type" TYPE "TransactionType_new" USING ("transaction_type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "account_status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "transaction_status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "user_type",
ADD COLUMN     "user_role" "UserRole" NOT NULL;

-- DropEnum
DROP TYPE "UserType";
