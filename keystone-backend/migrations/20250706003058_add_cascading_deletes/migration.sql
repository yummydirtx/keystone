-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_owner_id_fkey";

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
