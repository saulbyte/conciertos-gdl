CREATE TYPE "AdmissionType" AS ENUM ('FREE', 'PAID', 'UNKNOWN');

ALTER TABLE "Event"
ADD COLUMN "admissionType" "AdmissionType" NOT NULL DEFAULT 'UNKNOWN';

UPDATE "Event"
SET "admissionType" = 'FREE'
WHERE
  LOWER("title") LIKE '%gratis%'
  OR LOWER(COALESCE("description", '')) LIKE '%concierto gratuito%'
  OR LOWER(COALESCE("description", '')) LIKE '%evento gratuito%'
  OR LOWER(COALESCE("description", '')) LIKE '%entrada libre%'
  OR LOWER(COALESCE("description", '')) LIKE '%acceso libre%'
  OR LOWER(COALESCE("description", '')) LIKE '%entrada gratuita%'
  OR LOWER(COALESCE("description", '')) LIKE '%acceso gratuito%'
  OR LOWER(COALESCE("description", '')) LIKE '%sin costo%';

CREATE INDEX "Event_admissionType_idx" ON "Event"("admissionType");
