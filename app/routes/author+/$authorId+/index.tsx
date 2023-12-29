import { invariantResponse } from '@epic-web/invariant'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getAuthorImgSrc } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const author = await prisma.author.findFirst({
		select: {
			id: true,
			fullName: true,
			lastFirst: true,
			createdAt: true,
			images: true,
		},
		where: {
			id: params.authorId,
		},
	})

	invariantResponse(author, 'User not found', { status: 404 })

	return json({
		author,
		userJoinedDisplay: author.createdAt.toLocaleDateString(),
	})
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const { author } = data

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src={getAuthorImgSrc(author.images)}
								alt={author.fullName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<h1 className="text-center text-h2">{author.fullName}</h1>
					</div>
					<p className="mt-2 text-center text-muted-foreground">
						{author.lastFirst}
					</p>
					<p className="mt-2 text-center text-muted-foreground">
						Joined {data.userJoinedDisplay}
					</p>
					<div className="mt-10 flex gap-4">
						<>
							<Button asChild>
								<Link to="books" prefetch="intent">
									Books
								</Link>
							</Button>
							<Button asChild>
								<Link to="series" prefetch="intent">
									Series
								</Link>
							</Button>
							<Button asChild>
								<Link to="edit">Edit author</Link>
							</Button>
						</>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.author.fullName ?? params.authorId
	return [
		{ title: `${displayName} | Profile` },
		{
			name: 'description',
			content: `Profile of ${displayName}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the id "{params.authorId}" exists</p>
				),
			}}
		/>
	)
}
