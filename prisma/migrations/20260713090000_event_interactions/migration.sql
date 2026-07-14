CREATE TYPE "InteractionAction" AS ENUM (
    'EVENT_VIEW',
    'EVENT_LIKE',
    'EVENT_SHARE',
    'SOURCE_OPEN',
    'ARTIST_VIEW',
    'ARTIST_SUBSCRIBE'
);

CREATE TABLE "EventInteraction" (
    "id" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "action" "InteractionAction" NOT NULL,
    "eventId" TEXT,
    "artistId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventInteraction_visitorHash_idx" ON "EventInteraction"("visitorHash");
CREATE INDEX "EventInteraction_action_idx" ON "EventInteraction"("action");
CREATE INDEX "EventInteraction_eventId_idx" ON "EventInteraction"("eventId");
CREATE INDEX "EventInteraction_artistId_idx" ON "EventInteraction"("artistId");
CREATE INDEX "EventInteraction_createdAt_idx" ON "EventInteraction"("createdAt");

ALTER TABLE "EventInteraction"
ADD CONSTRAINT "EventInteraction_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventInteraction"
ADD CONSTRAINT "EventInteraction_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
