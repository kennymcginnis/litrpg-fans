import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getAuthorImgSrc, useDelayedIsPending } from '#app/utils/misc.tsx'

const AuthorSearchResultSchema = z.object({
	id: z.string(),
	fullName: z.string(),
	lastFirst: z.string(),
	imageId: z.string().nullable(),
})

const AuthorSearchResultsSchema = z.array(AuthorSearchResultSchema)

export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/authors')
	}

	const like = `%${searchTerm ?? ''}%`
	const rawAuthors = await prisma.$queryRaw`
		SELECT Author.id, Author.fullName, Author.lastFirst, img1.id AS imageId
		FROM Author
		-- LEFT JOIN AuthorImage ON Author.id = AuthorImage.authorId
		-- This would be for finding the most recently updated image:
		LEFT JOIN AuthorImage img1 ON Author.id = img1.authorId
		LEFT JOIN AuthorImage img2 ON (Author.id = img2.authorId AND (img1.updatedAt < img2.updatedAt OR (img1.updatedAt = img2.updatedAt AND img1.id < img2.id)))
		WHERE img2.id IS NULL
		AND (Author.fullName LIKE ${like} OR Author.lastFirst LIKE ${like})
		ORDER BY Author.lastFirst
		LIMIT 49
	`

	const result = AuthorSearchResultsSchema.safeParse(rawAuthors)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}
	return json({ status: 'idle', authors: result.data } as const)
}

export default function AuthorsRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/author',
	})

	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Authors</h1>
			<div className="w-full max-w-[700px] ">
				<SearchBar
					formAction="/author"
					status={data.status}
					autoFocus
					autoSubmit
				/>
			</div>
			<main>
				{data.status === 'idle' ? (
					data.authors.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.authors.map(author => (
								<li key={author.id}>
									<Link
										to={author.id}
										className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
									>
										<img
											alt={author.lastFirst}
											src={getAuthorImgSrc(author.imageId)}
											className="h-16 w-16 rounded-full"
										/>
										<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
											{author.lastFirst}
										</span>
										<span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
											{author.fullName}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No authors found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
