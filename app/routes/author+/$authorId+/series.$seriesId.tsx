import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useLoaderData,
	type MetaFunction,
	Outlet,
} from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getBookImgSrcClosestToSize, useIsPending } from '#app/utils/misc.tsx'
// import { userHasPermission } from '#app/utils/permissions.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
// import { useOptionalUser } from '#app/utils/user.ts'
import { type loader as seriesLoader } from './series.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const series = await prisma.series.findUnique({
		select: {
			id: true,
			name: true,
			updatedBy: true,
			updatedAt: true,
			books: {
				select: {
					id: true,
					title: true,
					seriesSequence: true,
					images: {
						orderBy: { updatedAt: 'asc' },
					},
					rating: { select: { rating: true, reviews: true } },
				},
			},
		},
		where: { id: params.seriesId },
	})

	invariantResponse(series, 'Not found', { status: 404 })

	const date = new Date(series.updatedAt)
	const timeAgo = formatDistanceToNow(date)
	const modified =
		series.updatedBy === 'System'
			? timeAgo
			: `${timeAgo} by ${series.updatedBy}`

	return json({
		series,
		modified,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-series'),
	seriesId: z.string(),
})

export async function action({ request, params }: DataFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	const submission = parse(formData, {
		schema: DeleteFormSchema,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { seriesId } = submission.value

	const series = await prisma.series.findFirst({
		select: { id: true, authors: true },
		where: { id: seriesId },
	})
	invariantResponse(series, 'Not found', { status: 404 })

	// const isOwner = series.ownerId === userId
	// await requireUserWithPermission(
	// 	request,
	// 	isOwner ? `delete:series:own` : `delete:series:any`,
	// )

	await prisma.series.delete({ where: { id: series.id } })

	return redirectWithToast(`/author/${series.authors[0].authorId}/notes`, {
		type: 'success',
		title: 'Success',
		description: 'Your note has been deleted.',
	})
}

export default function SeriesRoute() {
	const data = useLoaderData<typeof loader>()

	const sortedBooks =
		data?.series.books.sort((a, b) => {
			return a?.seriesSequence && b?.seriesSequence
				? a.seriesSequence - b.seriesSequence
				: 0
		}) || []
	// const user = useOptionalUser()
	// const isOwner = user?.id === data.series.
	// const canDelete = userHasPermission(
	// 	user,
	// 	isOwner ? `delete:series:own` : `delete:series:any`,
	// )
	// const displayBar = canDelete || isOwner

	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.series.name}</h2>
			<div className="overflow-y-auto pb-12">
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.series.name}
				</p>
				<ul className="flex flex-wrap gap-5 py-5">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[40px]">Cover</TableHead>
								<TableHead className="w-[40px] text-right">Sequence</TableHead>
								<TableHead>Title</TableHead>
								<TableHead className="w-[40px] text-right">Average</TableHead>
								<TableHead className="w-[60px] text-right">Reviews</TableHead>
								<TableHead className="w-[10px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedBooks.map(book => {
								const [image] = book.images
								return (
									<TableRow key={book.id}>
										<TableCell>
											<img
												src={getBookImgSrcClosestToSize(book.images, 'sm')}
												alt={image?.altText || book.title}
												className="object-cover"
											/>
										</TableCell>
										<TableCell className="text-right">
											{book.seriesSequence}
										</TableCell>
										<TableCell className="font-medium">{book.title}</TableCell>
										<TableCell className="text-right">
											{Number(book?.rating?.rating).toPrecision(3)}
										</TableCell>
										<TableCell className="text-right">
											{Number(book?.rating?.reviews).toLocaleString()}
										</TableCell>
										<TableCell>
											<Link to={book.id} className="w-full">
												<Icon name="magnifying-glass" size="sm" />
											</Link>
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</ul>
				<Outlet />
			</div>
			<div className={floatingToolbarClassName}>
				<span className="text-sm text-foreground/90 max-[524px]:hidden">
					<Icon name="clock" className="scale-125">
						Last modified {data.modified}
					</Icon>
				</span>
				<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
					<DeleteSeries id={data.series.id} />
					<Button
						asChild
						className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
					>
						<Link to="edit">
							<Icon name="pencil-1" className="scale-125 max-md:scale-150">
								<span className="max-md:hidden">Edit</span>
							</Icon>
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}

export function DeleteSeries({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-series',
		lastSubmission: actionData?.submission,
	})

	return (
		<Form method="POST" {...form.props}>
			<AuthenticityTokenInput />
			<input type="hidden" name="seriesId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-series"
				variant="destructive"
				status={isPending ? 'pending' : actionData?.status ?? 'idle'}
				disabled={isPending}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">Delete</span>
				</Icon>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export const meta: MetaFunction<
	typeof loader,
	{ 'routes/author+/$authorId+/series': typeof seriesLoader }
> = ({ data, params, matches }) => {
	const seriesMatch = matches.find(
		m => m.id === 'routes/author+/$authorId+/series',
	)
	const displayName = seriesMatch?.data?.author.id ?? params.authorId
	const seriesName = data?.series.name ?? 'Series'
	const seriesContentsSummary =
		data && data.series.name.length > 100
			? data.series.name.slice(0, 97) + '...'
			: 'No content'
	return [
		{ name: `${seriesName} | ${displayName}'s Series` },
		{
			name: 'description',
			content: seriesContentsSummary,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>You are not allowed to do that</p>,
				404: ({ params }) => (
					<p>No series with the id "{params.seriesId}" exists</p>
				),
			}}
		/>
	)
}
