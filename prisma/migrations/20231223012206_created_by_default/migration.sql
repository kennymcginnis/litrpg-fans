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
    "datePublished" DATETIME,
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
CREATE TABLE "new_Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "lastFirst" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Author" ("createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt", "urlSegment") SELECT "createdAt", "createdBy", "fullName", "id", "lastFirst", "updatedAt", "urlSegment" FROM "Author";
DROP TABLE "Author";
ALTER TABLE "new_Author" RENAME TO "Author";
CREATE UNIQUE INDEX "Author_urlSegment_key" ON "Author"("urlSegment");
CREATE TABLE "new_AuthorImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthorImage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuthorImage" ("altText", "authorId", "blob", "contentType", "createdAt", "createdBy", "id", "updatedAt") SELECT "altText", "authorId", "blob", "contentType", "createdAt", "createdBy", "id", "updatedAt" FROM "AuthorImage";
DROP TABLE "AuthorImage";
ALTER TABLE "new_AuthorImage" RENAME TO "AuthorImage";
CREATE INDEX "AuthorImage_authorId_idx" ON "AuthorImage"("authorId");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tag" ("createdAt", "createdBy", "id", "name", "updatedAt") SELECT "createdAt", "createdBy", "id", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE TABLE "new_AuthorsBooks" (
    "authorId" TEXT NOT NULL,
    "booksId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'System',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("authorId", "booksId"),
    CONSTRAINT "AuthorsBooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorsBooks_booksId_fkey" FOREIGN KEY ("booksId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuthorsBooks" ("assignedAt", "assignedBy", "authorId", "booksId") SELECT "assignedAt", "assignedBy", "authorId", "booksId" FROM "AuthorsBooks";
DROP TABLE "AuthorsBooks";
ALTER TABLE "new_AuthorsBooks" RENAME TO "AuthorsBooks";
CREATE TABLE "new_BookImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
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
CREATE TABLE "new_TagsOnBooks" (
    "tagId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'System',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tagId", "bookId"),
    CONSTRAINT "TagsOnBooks_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TagsOnBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TagsOnBooks" ("assignedAt", "assignedBy", "bookId", "tagId") SELECT "assignedAt", "assignedBy", "bookId", "tagId" FROM "TagsOnBooks";
DROP TABLE "TagsOnBooks";
ALTER TABLE "new_TagsOnBooks" RENAME TO "TagsOnBooks";
CREATE TABLE "new_Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "urlSegment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Series" ("createdAt", "createdBy", "id", "name", "updatedAt", "urlSegment") SELECT "createdAt", "createdBy", "id", "name", "updatedAt", "urlSegment" FROM "Series";
DROP TABLE "Series";
ALTER TABLE "new_Series" RENAME TO "Series";
CREATE UNIQUE INDEX "Series_urlSegment_key" ON "Series"("urlSegment");
CREATE TABLE "new_AuthorsSeries" (
    "authorId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'System',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("authorId", "seriesId"),
    CONSTRAINT "AuthorsSeries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorsSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuthorsSeries" ("assignedAt", "assignedBy", "authorId", "seriesId") SELECT "assignedAt", "assignedBy", "authorId", "seriesId" FROM "AuthorsSeries";
DROP TABLE "AuthorsSeries";
ALTER TABLE "new_AuthorsSeries" RENAME TO "AuthorsSeries";
CREATE TABLE "new_TagsOnSeries" (
    "tagId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL DEFAULT 'System',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tagId", "seriesId"),
    CONSTRAINT "TagsOnSeries_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TagsOnSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TagsOnSeries" ("assignedAt", "assignedBy", "seriesId", "tagId") SELECT "assignedAt", "assignedBy", "seriesId", "tagId" FROM "TagsOnSeries";
DROP TABLE "TagsOnSeries";
ALTER TABLE "new_TagsOnSeries" RENAME TO "TagsOnSeries";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
