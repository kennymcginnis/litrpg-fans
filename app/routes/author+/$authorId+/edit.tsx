import { invariantResponse } from '@epic-web/invariant'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { AuthorEditor, action } from '../__author-editor.tsx'

export { action }

export async function loader({ params, request }: DataFunctionArgs) {
	const author = await prisma.author.findFirst({
		select: {
			id: true,
			fullName: true,
			lastFirst: true,
			createdBy: true,
			createdAt: true,
			links: {
				select: {
					source: true,
					url: true,
				},
			},
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
		where: {
			id: params.authorId,
		},
	})
	invariantResponse(author, 'Not found', { status: 404 })
	return json({ author: author })
}

export default function AuthorEdit() {
	const data = useLoaderData<typeof loader>()

	return <AuthorEditor author={data.author} />
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No author with the id "{params.authorId}" exists</p>
				),
			}}
		/>
	)
}
