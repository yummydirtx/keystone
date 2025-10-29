-- AlterTable
ALTER TABLE "guest_tokens" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
