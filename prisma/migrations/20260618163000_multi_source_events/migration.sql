-- AlterEnum
ALTER TYPE "EventSource" ADD VALUE 'VISIT_JALISCO';

-- DropIndex
DROP INDEX "Event_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Event_source_externalId_key" ON "Event"("source", "externalId");
