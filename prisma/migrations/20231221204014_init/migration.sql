-- CreateTable
CREATE TABLE "UsersReviews" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "dateRead" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "bookId"),
    CONSTRAINT "UsersReviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsersReviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "lastFirst" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthorImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthorImage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authorId" TEXT,
    "bookId" TEXT,
    "seriesId" TEXT,
    CONSTRAINT "Link_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Link_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Link_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isbn" TEXT,
    "isbn13" TEXT,
    "asin" TEXT,
    "pages" INTEGER,
    "avgRating" DECIMAL NOT NULL,
    "numRatings" INTEGER NOT NULL,
    "datePublished" DATE,
    "seriesId" TEXT,
    "seriesSequence" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BookImage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthorsBooks" (
    "authorId" TEXT NOT NULL,
    "booksId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("authorId", "booksId"),
    CONSTRAINT "AuthorsBooks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorsBooks_booksId_fkey" FOREIGN KEY ("booksId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthorsSeries" (
    "authorId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("authorId", "seriesId"),
    CONSTRAINT "AuthorsSeries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorsSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TagsOnBooks" (
    "tagId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tagId", "bookId"),
    CONSTRAINT "TagsOnBooks_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TagsOnBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TagsOnSeries" (
    "tagId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tagId", "seriesId"),
    CONSTRAINT "TagsOnSeries_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TagsOnSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotesOnAuthors" (
    "noteId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("noteId", "authorId"),
    CONSTRAINT "NotesOnAuthors_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotesOnAuthors_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotesOnBooks" (
    "noteId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("noteId", "bookId"),
    CONSTRAINT "NotesOnBooks_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotesOnBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotesOnSeries" (
    "noteId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("noteId", "seriesId"),
    CONSTRAINT "NotesOnSeries_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotesOnSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuthorImage_authorId_idx" ON "AuthorImage"("authorId");

-- CreateIndex
CREATE INDEX "BookImage_bookId_idx" ON "BookImage"("bookId");