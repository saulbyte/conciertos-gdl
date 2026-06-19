CREATE TABLE "EventLike" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventLike_eventId_visitorHash_key"
ON "EventLike"("eventId", "visitorHash");

CREATE INDEX "EventLike_eventId_idx" ON "EventLike"("eventId");
CREATE INDEX "EventLike_createdAt_idx" ON "EventLike"("createdAt");

ALTER TABLE "EventLike"
ADD CONSTRAINT "EventLike_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
