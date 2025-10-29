-- AlterTable
ALTER TABLE "approvals" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "submitter_id" DROP NOT NULL;
