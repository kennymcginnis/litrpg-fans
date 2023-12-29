/*
  Warnings:

  - Added the required column `grno` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "size" TEXT NOT NULL DEFAULT 'md',
    "bookId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BookImage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BookImage" ("altText", "blob", "bookId", "contentType", "createdAt", "createdBy", "id", "updatedAt") SELECT "altText", "blob", "bookId", "contentType", "createdAt", "createdBy", "id", "updatedAt" FROM "BookImage";
DROP TABLE "BookImage";
ALTER TABLE "new_BookImage" RENAME TO "BookImage";
CREATE INDEX "BookImage_bookId_idx" ON "BookImage"("bookId");
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isbn" TEXT,
    "isbn13" TEXT,
    "asin" TEXT,
    "pages" INTEGER,
    "datePublished" TEXT,
    "grno" TEXT NOT NULL,
    "seriesId" TEXT,
    "seriesSequence" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL DEFAULT 'System',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt", "updatedBy") SELECT "asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt", "updatedBy" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
