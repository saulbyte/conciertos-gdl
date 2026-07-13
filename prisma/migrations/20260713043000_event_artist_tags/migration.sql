CREATE TYPE "TagKind" AS ENUM ('GENRE', 'FORMAT', 'SIGNAL');

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TagKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTag" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 60,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTag_pkey" PRIMARY KEY ("eventId","tagId")
);

CREATE TABLE "ArtistTag" (
    "artistId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 60,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistTag_pkey" PRIMARY KEY ("artistId","tagId")
);

CREATE UNIQUE INDEX "Tag_slug_kind_key" ON "Tag"("slug", "kind");
CREATE INDEX "Tag_kind_idx" ON "Tag"("kind");
CREATE INDEX "EventTag_tagId_idx" ON "EventTag"("tagId");
CREATE INDEX "EventTag_confidence_idx" ON "EventTag"("confidence");
CREATE INDEX "ArtistTag_tagId_idx" ON "ArtistTag"("tagId");
CREATE INDEX "ArtistTag_confidence_idx" ON "ArtistTag"("confidence");

ALTER TABLE "EventTag"
ADD CONSTRAINT "EventTag_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventTag"
ADD CONSTRAINT "EventTag_tagId_fkey"
FOREIGN KEY ("tagId") REFERENCES "Tag"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistTag"
ADD CONSTRAINT "ArtistTag_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistTag"
ADD CONSTRAINT "ArtistTag_tagId_fkey"
FOREIGN KEY ("tagId") REFERENCES "Tag"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
