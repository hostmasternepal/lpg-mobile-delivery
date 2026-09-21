-- CreateTable
CREATE TABLE "dashboard_request_projections" (
    "request_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source_channel" TEXT NOT NULL,
    "district" TEXT,
    "has_priority_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_request_projections_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE INDEX "dashboard_request_projections_status_idx" ON "dashboard_request_projections"("status");

-- CreateIndex
CREATE INDEX "dashboard_request_projections_source_channel_idx" ON "dashboard_request_projections"("source_channel");

-- CreateIndex
CREATE INDEX "dashboard_request_projections_district_idx" ON "dashboard_request_projections"("district");
