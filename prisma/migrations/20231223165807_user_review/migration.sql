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
    "datePublished" TEXT,
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
CREATE TABLE "new_UsersReviews" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "dateRead" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "bookId"),
    CONSTRAINT "UsersReviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsersReviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UsersReviews" ("bookId", "createdAt", "dateRead", "rating", "review", "updatedAt", "userId") SELECT "bookId", "createdAt", "dateRead", "rating", "review", "updatedAt", "userId" FROM "UsersReviews";
DROP TABLE "UsersReviews";
ALTER TABLE "new_UsersReviews" RENAME TO "UsersReviews";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
