import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'
import { Prisma } from '@prisma/client'

export const SeriesCountResultSchema = z.object({
	count: z.bigint().transform(val => Number(val)),
})

export const SeriesSearchResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	images: z.string().transform(val => JSON.parse(val) as string[]),
	countOfBooks: z.bigint().transform(val => Number(val)),
	authors: z.string().transform(val => JSON.parse(val) as string[]),
})
export const SeriesSearchResultsSchema = z.array(SeriesSearchResultSchema)

export async function querySeries(
	searchTerm: string | null,
	limit: number,
	skip: number,
) {
	const like = `%${searchTerm ?? ''}%`
	const rawSeries = await prisma.$queryRaw`
	-- convert the authors into a sorted array
		SELECT id, name, images, countOfBooks, json_group_array(fullName) as authors
		FROM (
			-- sort the authors by the number of books they've contributed to in the series
			SELECT Series.id, Series.name, Series.images, Series.countOfBooks, Author.fullName
			FROM (
				-- convert the book images into an array sorted by sequence
				SELECT Series.id, Series.name, json_group_array(Book.imageId) as images, count(Book.id) as countOfBooks
				FROM Series
				INNER JOIN (
					-- find the latest small image for each book
					SELECT Book.id, Book.seriesId, Book.title, Book.description, Book.seriesSequence, img1.id AS imageId
					FROM Book
					LEFT JOIN BookImage img1 ON Book.id = img1.bookId AND img1.size = 'sm'
					LEFT JOIN BookImage img2 ON (Book.id = img2.bookId AND img2.size = 'sm' AND (img1.updatedAt < img2.updatedAt OR (img1.updatedAt = img2.updatedAt AND img1.id < img2.id)))
					WHERE img2.id IS NULL
					AND Book.seriesId IN (
						-- filter and paginate series
						SELECT DISTINCT Series.id
						FROM Book
						INNER JOIN Series On Book.seriesId = Series.id
						INNER JOIN AuthorsBooks ON AuthorsBooks.bookId = Book.id
						INNER JOIN Author ON AuthorsBooks.authorId = Author.id
						WHERE (Series.name LIKE ${like} OR Book.title LIKE ${like} OR Book.description LIKE ${like} OR Author.fullName LIKE ${like})
						LIMIT ${limit}
						OFFSET ${skip}
					)
				) Book ON Series.id = Book.seriesId
				GROUP BY Series.id, Series.name
				ORDER BY Book.seriesSequence
			) Series
			INNER JOIN Book ON Book.seriesId = Series.id
			INNER JOIN AuthorsBooks ON AuthorsBooks.bookId = Book.id
			INNER JOIN Author ON AuthorsBooks.authorId = Author.id
			GROUP BY Series.id, Series.name, Series.images, Series.countOfBooks, Author.fullName
			ORDER BY count(*) DESC
		) Authors
		GROUP BY id, name, images, countOfBooks`

	return rawSeries
}

export async function countSeries(searchTerm: string | null) {
	const like = `%${searchTerm ?? ''}%`
	return await prisma.$queryRaw`
			SELECT COUNT(*) as count
			FROM (
				SELECT DISTINCT Series.id
				FROM Book
				INNER JOIN Series On Book.seriesId = Series.id
				INNER JOIN AuthorsBooks ON AuthorsBooks.bookId = Book.id
				INNER JOIN Author ON AuthorsBooks.authorId = Author.id
				WHERE (Series.name LIKE ${like} OR Book.title LIKE ${like} OR Book.description LIKE ${like} OR Author.fullName LIKE ${like})
			)`
}

export async function seriesAuthors(seriesIds: string[]) {
	return await prisma.$queryRaw`
		SELECT seriesId, json_group_array(fullName) as authors
		FROM (
			SELECT Book.seriesId, Author.fullName, count(*) as count
			FROM Book
			INNER JOIN Series On Book.seriesId = Series.id
			INNER JOIN AuthorsBooks ON AuthorsBooks.bookId = Book.id
			INNER JOIN Author ON AuthorsBooks.bookId = Author.id
			WHERE Book.seriesId IN (${Prisma.join(seriesIds)})
			GROUP BY Book.seriesId, Author.fullName
			ORDER BY count(*) DESC
		) Authors`
}
