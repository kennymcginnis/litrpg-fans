import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { PaginationComponent } from '#app/components/pagination'
import { SearchBar } from '#app/components/search-bar.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getBookImgSrc, useDelayedIsPending } from '#app/utils/misc.tsx'

const BookCountResultSchema = z.object({
	count: z.bigint().transform(val => Number(val)),
})

const BookSearchResultSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	imageId: z.string().nullable(),
})

const BookSearchResultsSchema = z.array(BookSearchResultSchema)

const PER_PAGE = 35

export async function loader({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	const query = url.searchParams
	const currentPage = Math.max(Number(query.get('page') || 1), 1)
	const skip = (currentPage - 1) * PER_PAGE

	const searchTerm = query.get('search')
	if (searchTerm === '') {
		return redirect('/books')
	}

	const like = `%${searchTerm ?? ''}%`
	const rawBooks = await prisma.$queryRaw`
		SELECT Book.id, Book.title, Book.description, img1.id AS imageId
		FROM Book
		-- This is for finding the most recently updated image:
		LEFT JOIN BookImage img1 ON Book.id = img1.bookId AND img1.size = 'sm'
		LEFT JOIN BookImage img2 ON (Book.id = img2.bookId AND img2.size = 'sm' AND (img1.updatedAt < img2.updatedAt OR (img1.updatedAt = img2.updatedAt AND img1.id < img2.id)))
		WHERE img2.id IS NULL
		AND (Book.title LIKE ${like} OR Book.description LIKE ${like})
		ORDER BY Book.description
		LIMIT ${PER_PAGE}
		OFFSET ${skip}
	`

	const result = BookSearchResultsSchema.safeParse(rawBooks)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}

	if (like === '%%') {
		const count = await prisma.book.count()

		return json({
			status: 'idle',
			books: result.data,
			totalPages: Math.ceil(count / PER_PAGE),
		} as const)
	} else {
		const rawCount = await prisma.$queryRaw`
			SELECT COUNT(*) as count
			FROM (
				SELECT DISTINCT Book.id
				FROM Book
				WHERE (Book.title LIKE ${like} OR Book.description LIKE ${like}))`

		const parsed = BookCountResultSchema.safeParse(rawCount[0])
		if (!parsed.success) {
			return json({ status: 'error', error: parsed.error.message } as const, {
				status: 400,
			})
		}

		return json({
			status: 'idle',
			books: result.data,
			totalPages: Math.ceil(parsed.data / PER_PAGE),
		} as const)
	}
}

export default function BooksRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/book',
	})

	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Books</h1>
			<div className="w-full max-w-[700px] ">
				<SearchBar
					formAction="/books"
					status={data.status}
					autoFocus
					autoSubmit
				/>
			</div>
			<main>
				{data.status === 'idle' ? (
					data.books.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.books.map(book => (
								<li key={book.id}>
									<Link
										to={`/book/${book.id}`}
										className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
									>
										<img
											alt={book.description}
											src={getBookImgSrc(book.imageId)}
											className="h-[75px] w-[50px]"
										/>
										<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
											{book.title}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No books found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
			<footer>
				<PaginationComponent
					totalPages={data.totalPages}
					pageParam="page"
					className="mt-8"
				/>
			</footer>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
