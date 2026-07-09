ALTER TYPE "EventSource" ADD VALUE 'DISCOVERED';

CREATE TYPE "EventCandidateStatus" AS ENUM ('PENDING', 'REJECTED', 'IMPORTED');

CREATE TABLE "EventCandidate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "imageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT,
    "venueName" TEXT,
    "city" TEXT,
    "admissionType" "AdmissionType" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" "EventCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "rawText" TEXT,
    "importedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EventCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventCandidate_sourceUrl_title_key" ON "EventCandidate"("sourceUrl", "title");
CREATE INDEX "EventCandidate_status_idx" ON "EventCandidate"("status");
CREATE INDEX "EventCandidate_createdAt_idx" ON "EventCandidate"("createdAt");
CREATE INDEX "EventCandidate_eventDate_idx" ON "EventCandidate"("eventDate");
