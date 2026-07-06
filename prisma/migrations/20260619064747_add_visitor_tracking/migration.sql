-- CreateTable
CREATE TABLE "page_views" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "country" TEXT,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_stats" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "unique_visitor_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "visitor_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_created_at_idx" ON "page_views"("created_at");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_session_id_idx" ON "page_views"("session_id");

-- CreateIndex
CREATE INDEX "visitor_stats_date_idx" ON "visitor_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_stats_date_path_key" ON "visitor_stats"("date", "path");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
