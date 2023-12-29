import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { PaginationComponent } from '#app/components/pagination'
import { SearchBar } from '#app/components/search-bar.tsx'
import { cn, getBookImgSrc, useDelayedIsPending } from '#app/utils/misc.tsx'
import {
	countSeries,
	querySeries,
	SeriesCountResultSchema,
	SeriesSearchResultsSchema,
} from '#app/utils/series.ts'

export async function loader({ request }: DataFunctionArgs) {
	const limit = 24
	const url = new URL(request.url)
	const query = url.searchParams
	const currentPage = Math.max(Number(query.get('page') || 1), 1)
	const skip = (currentPage - 1) * limit

	const searchTerm = query.get('search')
	if (searchTerm === '') {
		return redirect('/series')
	}

	// Filter on either series name, author name, or book title/description
	const rawSeries = await querySeries(searchTerm, limit, skip)

	const seriesSearchResults = SeriesSearchResultsSchema.safeParse(rawSeries)
	if (!seriesSearchResults.success) {
		return json(
			{ status: 'error', error: seriesSearchResults.error.message } as const,
			{ status: 400 },
		)
	}

	const rawCount = await countSeries(searchTerm)

	const seriesCountResult = SeriesCountResultSchema.safeParse(rawCount[0])
	if (!seriesCountResult.success) {
		return json(
			{ status: 'error', error: seriesCountResult.error.message } as const,
			{ status: 400 },
		)
	}
	const countOfSeries: number = Number(seriesCountResult.data.count)
	const totalPages = Math.ceil(countOfSeries / limit)

	return json({
		status: 'idle',
		series: seriesSearchResults.data,
		totalPages,
		countOfSeries,
	} as const)
}

export default function SeriesRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/series',
	})

	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Series</h1>
			<div className="w-full max-w-[700px] ">
				<SearchBar
					formAction="/series"
					status={data.status}
					autoFocus
					autoSubmit
				/>
			</div>
			<main>
				{data.status === 'idle' ? (
					data.series.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.series.map(series => (
								<li key={series.id}>
									<Link
										to={`/series/${series.id}`}
										className="flex h-40 w-full flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
									>
										<span className="flex w-full flex-row justify-center">
											{series.images.slice(0, 25).map((image: any) => (
												<img
													key={image}
													alt={series.name}
													src={getBookImgSrc(image)}
													className="h-[75px] w-[50px]"
												/>
											))}
											{series.images.length > 25 ? (
												<p className="self-center px-1">{'. . .'}</p>
											) : null}
										</span>
										<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap px-5 text-center text-body-md">
											{series.name}
										</span>
										<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-sm">
											by {series.authors.join()} ({series.countOfBooks} Books)
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No series found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
			{data.series.length > 1 ? (
				<footer>
					<p className="text-center">
						- Showing {data.series.length} series out of {data.countOfSeries} -
					</p>
					<PaginationComponent
						totalPages={data.totalPages}
						pageParam="page"
						className="mt-8"
					/>
				</footer>
			) : null}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
