-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_token" TEXT,
ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
