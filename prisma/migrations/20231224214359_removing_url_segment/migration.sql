/*
  Warnings:

  - You are about to drop the column `urlSegment` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `urlSegment` on the `Series` table. All the data in the column will be lost.
  - You are about to drop the column `urlSegment` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Tag` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isbn" TEXT,
    "isbn13" TEXT,
    "asin" TEXT,
    "pages" INTEGER,
    "datePublished" TEXT,
    "seriesId" TEXT,
    "seriesSequence" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt") SELECT "asin", "createdAt", "createdBy", "datePublished", "description", "id", "isbn", "isbn13", "pages", "seriesId", "seriesSequence", "title", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE TABLE "new_Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL DEFAULT 'System',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Series" ("createdAt", "createdBy", "id", "name", "updatedAt", "updatedBy") SELECT "createdAt", "createdBy", "id", "name", "updatedAt", "updatedBy" FROM "Series";
DROP TABLE "Series";
ALTER TABLE "new_Series" RENAME TO "Series";
CREATE TABLE "new_Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "lastFirst" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Author" ("createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt") SELECT "createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt" FROM "Author";
DROP TABLE "Author";
ALTER TABLE "new_Author" RENAME TO "Author";
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tag" ("createdAt", "createdBy", "id", "updatedAt") SELECT "createdAt", "createdBy", "id", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
