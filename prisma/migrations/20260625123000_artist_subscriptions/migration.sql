CREATE TABLE "ArtistSubscription" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArtistSubscription_artistId_email_key"
ON "ArtistSubscription"("artistId", "email");

CREATE INDEX "ArtistSubscription_artistId_idx"
ON "ArtistSubscription"("artistId");

CREATE INDEX "ArtistSubscription_email_idx"
ON "ArtistSubscription"("email");

CREATE INDEX "ArtistSubscription_active_idx"
ON "ArtistSubscription"("active");

ALTER TABLE "ArtistSubscription"
ADD CONSTRAINT "ArtistSubscription_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
