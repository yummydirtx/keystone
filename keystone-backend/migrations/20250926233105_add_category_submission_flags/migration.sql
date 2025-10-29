-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "allow_guest_submissions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_user_submissions" BOOLEAN NOT NULL DEFAULT true;
