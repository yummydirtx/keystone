-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_expense_id_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_report_id_fkey";

-- DropForeignKey
ALTER TABLE "category_permissions" DROP CONSTRAINT "category_permissions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_report_id_fkey";

-- DropForeignKey
ALTER TABLE "guest_tokens" DROP CONSTRAINT "guest_tokens_category_id_fkey";

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_permissions" ADD CONSTRAINT "category_permissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_tokens" ADD CONSTRAINT "guest_tokens_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
