-- CreateTable: analytics_events
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID,
    "actorId" UUID,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "analytics_events_instituteId_eventType_occurredAt_idx" ON "analytics_events"("instituteId", "eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "analytics_events_actorId_occurredAt_idx" ON "analytics_events"("actorId", "occurredAt");
CREATE INDEX IF NOT EXISTS "analytics_events_eventType_occurredAt_idx" ON "analytics_events"("eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "analytics_events_entityType_entityId_idx" ON "analytics_events"("entityType", "entityId");

-- AddForeignKeys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_instituteId_fkey'
    ) THEN
        ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_actorId_fkey'
    ) THEN
        ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
