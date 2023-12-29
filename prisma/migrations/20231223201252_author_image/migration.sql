/*
  Warnings:

  - The primary key for the `AuthorsBooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `booksId` on the `AuthorsBooks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authorId]` on the table `AuthorImage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookId` to the `AuthorsBooks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AuthorImage_authorId_idx";

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsersReviews" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "dateRead" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "bookId"),
    CONSTRAINT "UsersReviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsersReviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UsersReviews" ("bookId", "createdAt", "dateRead", "rating", "review", "updatedAt", "userId") SELECT "bookId", "createdAt", "dateRead", "rating", "review", "updatedAt", "userId" FROM "UsersReviews";
DROP TABLE "UsersReviews";
ALTER TABLE "new_UsersReviews" RENAME TO "UsersReviews";
CREATE TABLE "new_AuthorsBooks" (
    "authorId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'System',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("authorId", "bookId"),
    CONSTRAINT "AuthorsBooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorsBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuthorsBooks" ("assignedAt", "assignedBy", "authorId") SELECT "assignedAt", "assignedBy", "authorId" FROM "AuthorsBooks";
DROP TABLE "AuthorsBooks";
ALTER TABLE "new_AuthorsBooks" RENAME TO "AuthorsBooks";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "AuthorImage_authorId_key" ON "AuthorImage"("authorId");
