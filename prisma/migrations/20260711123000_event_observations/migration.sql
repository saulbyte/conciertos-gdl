-- CreateEnum
CREATE TYPE "EventObservationType" AS ENUM (
    'SOURCE_CREATED',
    'SOURCE_UPDATED',
    'SOURCE_DUPLICATE',
    'CANDIDATE_CREATED',
    'CANDIDATE_UPDATED',
    'CANDIDATE_REJECTED_DUPLICATE',
    'CANDIDATE_IMPORTED'
);

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "priceMin" DECIMAL(10,2),
ADD COLUMN "priceMax" DECIMAL(10,2),
ADD COLUMN "currency" TEXT,
ADD COLUMN "availabilityStatus" TEXT,
ADD COLUMN "lastObservedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventObservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "candidateId" TEXT,
    "source" "EventSource" NOT NULL,
    "type" "EventObservationType" NOT NULL,
    "title" TEXT,
    "artistName" TEXT,
    "venueName" TEXT,
    "city" TEXT,
    "eventDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "priceMin" DECIMAL(10,2),
    "priceMax" DECIMAL(10,2),
    "currency" TEXT,
    "availabilityStatus" TEXT,
    "confidence" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_lastObservedAt_idx" ON "Event"("lastObservedAt");
CREATE INDEX "EventObservation_eventId_idx" ON "EventObservation"("eventId");
CREATE INDEX "EventObservation_candidateId_idx" ON "EventObservation"("candidateId");
CREATE INDEX "EventObservation_source_idx" ON "EventObservation"("source");
CREATE INDEX "EventObservation_type_idx" ON "EventObservation"("type");
CREATE INDEX "EventObservation_createdAt_idx" ON "EventObservation"("createdAt");
CREATE INDEX "EventObservation_eventDate_idx" ON "EventObservation"("eventDate");

-- AddForeignKey
ALTER TABLE "EventObservation"
ADD CONSTRAINT "EventObservation_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventObservation"
ADD CONSTRAINT "EventObservation_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "EventCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
