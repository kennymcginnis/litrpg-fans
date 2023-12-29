-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL DEFAULT 'System',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Series" ("createdAt", "createdBy", "id", "name", "updatedAt", "urlSegment") SELECT "createdAt", "createdBy", "id", "name", "updatedAt", "urlSegment" FROM "Series";
DROP TABLE "Series";
ALTER TABLE "new_Series" RENAME TO "Series";
CREATE UNIQUE INDEX "Series_urlSegment_key" ON "Series"("urlSegment");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
