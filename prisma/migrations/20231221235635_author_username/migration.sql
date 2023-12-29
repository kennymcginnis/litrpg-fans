/*
  Warnings:

  - Added the required column `displayName` to the `Author` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" DECIMAL NOT NULL,
    "reviews" INTEGER NOT NULL,
    "bookId" TEXT,
    "seriesId" TEXT,
    CONSTRAINT "Ratings_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ratings_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "lastFirst" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Author" ("createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt") SELECT "createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt" FROM "Author";
DROP TABLE "Author";
ALTER TABLE "new_Author" RENAME TO "Author";
CREATE UNIQUE INDEX "Author_displayName_key" ON "Author"("displayName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Ratings_bookId_key" ON "Ratings"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Ratings_seriesId_key" ON "Ratings"("seriesId");
