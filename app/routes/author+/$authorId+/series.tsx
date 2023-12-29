import { invariantResponse } from '@epic-web/invariant'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getAuthorImgSrc } from '#app/utils/misc.tsx'
import { userHasRole } from '#app/utils/permissions'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: DataFunctionArgs) {
	const author = await prisma.author.findFirst({
		select: {
			id: true,
			fullName: true,
			lastFirst: true,
			images: {			
				select: { id: true, altText: true },
				orderBy: { updatedAt: 'desc' },
				take: 1
			},
			series: { select: { series: true } },
		},
		where: { id: params.authorId },
	})

	invariantResponse(author, 'Author not found', { status: 404 })

	return json({ author })
}

export default function SeriesRoute() {
	const { author } = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const isAdmin = user ? userHasRole(user, 'admin') : false

	const navLinkDefaultClassName =
		'line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl'
	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:mx-2 md:rounded-3xl md:pr-0">
				<div className="relative col-span-1">
					<div className="absolute inset-0 flex flex-col">
						<Link
							to={`/author/${author.id}`}
							className="flex flex-col items-center justify-center gap-2 bg-muted pb-4 pl-8 pr-4 pt-12 lg:flex-row lg:justify-start lg:gap-4"
						>
							<img
								src={getAuthorImgSrc(author.images.shift())}
								alt={author.fullName}
								className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
							/>
							<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
								{author.fullName}'s Series
							</h1>
						</Link>
						<ul className="overflow-y-auto overflow-x-hidden pb-12">
							{isAdmin ? (
								<li className="p-1 pr-0">
									<NavLink
										to="new"
										className={({ isActive }) =>
											cn(navLinkDefaultClassName, isActive && 'bg-accent')
										}
									>
										<Icon name="plus">New Series</Icon>
									</NavLink>
								</li>
							) : null}
							{author.series.map(({ series }) => (
								<li key={series.id} className="p-1 pr-0">
									<NavLink
										to={series.id}
										preventScrollReset
										prefetch="intent"
										className={({ isActive }) =>
											cn(navLinkDefaultClassName, isActive && 'bg-accent')
										}
									>
										{series.name}
									</NavLink>
								</li>
							))}
						</ul>
					</div>
				</div>
				<div className="relative col-span-3 bg-accent md:rounded-r-3xl">
					<Outlet />
				</div>
			</div>
		</main>
	)
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