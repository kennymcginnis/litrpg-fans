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
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getBookImgSrc, useIsPending } from '#app/utils/misc.tsx'
import {
	requireUserWithPermission,
	userHasPermission,
} from '#app/utils/permissions.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type loader as booksLoader } from './books.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const book = await prisma.book.findUnique({
		select: {
			id: true,
			title: true,
			description: true,
			isbn: true,
			isbn13: true,
			asin: true,
			pages: true,
			datePublished: true,
			links: true,
			series: { select: { id: true, name: true } },
			seriesSequence: true,
			authors: { select: { author: { select: { id: true, fullName: true } } } },
			tags: { select: { tagId: true } },
			images: {
				select: { id: true, size: true, altText: true },
				orderBy: { updatedAt: 'asc' },
			},
			notes: { select: { note: true } },
			rating: { select: { rating: true, reviews: true } },
			updatedAt: true,
			updatedBy: true,
		},
		where: { id: params.bookId },
	})

	invariantResponse(book, 'Not found', { status: 404 })

	const date = new Date(book.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return json({
		book,
		timeAgo,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-book'),
	bookId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
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

	const { bookId } = submission.value

	const book = await prisma.book.findFirst({
		select: { id: true },
		where: { id: bookId },
	})
	invariantResponse(book, 'Not found', { status: 404 })

	// const isOwner = book.ownerId === userId
	// await requireUserWithPermission(
	// 	request,
	// 	isOwner ? `delete:book:own` : `delete:book:any`,
	// )

	await prisma.book.delete({ where: { id: book.id } })

	return redirectWithToast(`/users/${book.owner.username}/books`, {
		type: 'success',
		title: 'Success',
		description: 'Your book has been deleted.',
	})
}

export default function BookRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const isOwner = user?.id === data.book.ownerId
	const canDelete = userHasPermission(
		user,
		isOwner ? `delete:book:own` : `delete:book:any`,
	)
	const displayBar = canDelete || isOwner

	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.book.title}</h2>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
				<ul className="flex flex-wrap gap-5 py-5">
					{data.book.images.map(image => (
						<li key={image.id}>
							<a href={getBookImgSrc(image.id)}>
								<img
									src={getBookImgSrc(image.id)}
									alt={image.altText ?? ''}
									className="h-32 w-32 rounded-lg object-cover"
								/>
							</a>
						</li>
					))}
				</ul>
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.book.description}
				</p>
			</div>
			{displayBar ? (
				<div className={floatingToolbarClassName}>
					<span className="text-sm text-foreground/90 max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{data.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						{canDelete ? <DeleteBook id={data.book.id} /> : null}
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
			) : null}
		</div>
	)
}

export function DeleteBook({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-book',
		lastSubmission: actionData?.submission,
	})

	return (
		<Form method="POST" {...form.props}>
			<AuthenticityTokenInput />
			<input type="hidden" name="bookId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-book"
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
	{ 'routes/users+/$username_+/books': typeof booksLoader }
> = ({ data, params, matches }) => {
	const booksMatch = matches.find(
		m => m.id === 'routes/users+/$username_+/books',
	)
	const displayName = booksMatch?.data?.owner.name ?? params.username
	const bookTitle = data?.book.title ?? 'Book'
	const bookdescriptionsSummary =
		data && data.book.description.length > 100
			? data?.book.description.slice(0, 97) + '...'
			: 'No description'
	return [
		{ title: `${bookTitle} | ${displayName}'s Books | Epic Books` },
		{
			name: 'description',
			description: bookdescriptionsSummary,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>You are not allowed to do that</p>,
				404: ({ params }) => (
					<p>No book with the id "{params.bookId}" exists</p>
				),
			}}
		/>
	)
}
