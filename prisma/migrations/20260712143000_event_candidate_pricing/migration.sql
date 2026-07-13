-- Add pricing captured by the discovery radar before a candidate is imported.
ALTER TABLE "EventCandidate"
ADD COLUMN "priceMin" DECIMAL(10, 2),
ADD COLUMN "priceMax" DECIMAL(10, 2),
ADD COLUMN "currency" TEXT;
