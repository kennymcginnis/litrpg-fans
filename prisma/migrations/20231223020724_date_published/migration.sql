-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "isbn" TEXT,
    "isbn13" TEXT,
    "asin" TEXT,
    "pages" INTEGER,
    "datePublished" DATE,
    "seriesId" TEXT,
    "seriesSequence" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt", "urlSegment") SELECT "asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt", "urlSegment" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_urlSegment_key" ON "Book"("urlSegment");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
