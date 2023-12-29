import { Link } from '@remix-run/react'
import { cn } from '#app/utils/misc.tsx'

export function MainNav({
	className,
	...props
}: React.HTMLAttributes<HTMLElement>) {
	return (
		<nav
			className={cn('flex items-center space-x-4 lg:space-x-6', className)}
			{...props}
		>
			<Link
				to="/authors"
				// className="text-sm font-medium transition-colors hover:text-primary"
				className="text-md font-medium  transition-colors hover:text-primary"
			>
				Authors
			</Link>
			<Link
				to="/series"
				className="text-md font-medium  transition-colors hover:text-primary"
			>
				Series
			</Link>
			<Link
				to="/books"
				className="text-md font-medium  transition-colors hover:text-primary"
			>
				Books
			</Link>
			<Link
				to="/users"
				className="text-md font-medium  transition-colors hover:text-primary"
			>
				Users
			</Link>
		</nav>
	)
}
