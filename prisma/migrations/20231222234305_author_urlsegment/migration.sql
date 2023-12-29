/*
  Warnings:

  - You are about to drop the column `displayName` on the `Author` table. All the data in the column will be lost.
  - Added the required column `urlSegment` to the `Author` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urlSegment` to the `Series` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urlSegment` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "lastFirst" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Author" ("createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt") SELECT "createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt" FROM "Author";
DROP TABLE "Author";
ALTER TABLE "new_Author" RENAME TO "Author";
CREATE UNIQUE INDEX "Author_urlSegment_key" ON "Author"("urlSegment");
CREATE TABLE "new_Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Series" ("createdAt", "createdBy", "id", "name", "updatedAt") SELECT "createdAt", "createdBy", "id", "name", "updatedAt" FROM "Series";
DROP TABLE "Series";
ALTER TABLE "new_Series" RENAME TO "Series";
CREATE UNIQUE INDEX "Series_urlSegment_key" ON "Series"("urlSegment");
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "isbn" TEXT,
    "isbn13" TEXT,
    "asin" TEXT,
    "pages" INTEGER,
    "avgRating" DECIMAL NOT NULL,
    "numRatings" INTEGER NOT NULL,
    "datePublished" DATETIME,
    "seriesId" TEXT,
    "seriesSequence" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("asin", "avgRating", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "numRatings", "pages", "seriesId", "seriesSequence", "title", "updatedAt") SELECT "asin", "avgRating", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "numRatings", "pages", "seriesId", "seriesSequence", "title", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_urlSegment_key" ON "Book"("urlSegment");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
