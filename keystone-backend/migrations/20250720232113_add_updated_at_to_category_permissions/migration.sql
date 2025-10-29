/*
  Warnings:

  - Added the required column `updated_at` to the `category_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "category_permissions" ADD COLUMN "updated_at" TIMESTAMP(3);

-- Update existing rows to set updated_at to created_at
UPDATE "category_permissions" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;

-- Make the column NOT NULL after setting values
ALTER TABLE "category_permissions" ALTER COLUMN "updated_at" SET NOT NULL;
