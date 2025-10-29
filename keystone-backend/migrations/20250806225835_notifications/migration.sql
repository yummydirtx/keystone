-- CreateEnum
CREATE TYPE "public"."PushPlatform" AS ENUM ('ios', 'android', 'web');

-- CreateEnum
CREATE TYPE "public"."PushProvider" AS ENUM ('expo', 'fcm', 'apns', 'webpush');

-- CreateEnum
CREATE TYPE "public"."NotificationEvent" AS ENUM ('expense_created', 'expense_approved', 'expense_denied', 'mention', 'weekly_summary');

-- CreateTable
CREATE TABLE "public"."notification_endpoints" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" "public"."PushPlatform" NOT NULL,
    "provider" "public"."PushProvider" NOT NULL DEFAULT 'expo',
    "token" TEXT NOT NULL,
    "subscription" JSONB,
    "app" TEXT,
    "locale" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event" "public"."NotificationEvent" NOT NULL,
    "push" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_endpoints_user_id_idx" ON "public"."notification_endpoints"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_endpoints_provider_token_key" ON "public"."notification_endpoints"("provider", "token");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "public"."notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_event_key" ON "public"."notification_preferences"("user_id", "event");

-- AddForeignKey
ALTER TABLE "public"."notification_endpoints" ADD CONSTRAINT "notification_endpoints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
