-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "public"."categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "categories_report_id_idx" ON "public"."categories"("report_id");

-- CreateIndex
CREATE INDEX "category_permissions_category_id_role_idx" ON "public"."category_permissions"("category_id", "role");

-- CreateIndex
CREATE INDEX "category_permissions_user_id_idx" ON "public"."category_permissions"("user_id");
