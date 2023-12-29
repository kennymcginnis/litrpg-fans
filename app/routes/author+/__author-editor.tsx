import {
	conform,
	list,
	useFieldList,
	useFieldset,
	useForm,
	type FieldConfig,
} from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type Author, type AuthorImage } from '@prisma/client'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useRef, useState } from 'react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getAuthorImgSrc, useIsPending } from '#app/utils/misc.tsx'

import { debug } from '#app/utils/debug'

const minLength = 1
const maxLength = 100

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine(file => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})
const LinkFieldsetSchema = z.object({
	id: z.string().optional(),
	source: z.string().min(minLength).max(maxLength),
	url: z.string().min(10).max(1000),
})

type ImageFieldset = z.infer<typeof ImageFieldsetSchema>
type LinkFieldset = z.infer<typeof LinkFieldsetSchema>

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
	return image.id != null
}

function linkHasId(
	link: LinkFieldset,
): link is LinkFieldset & { id: NonNullable<LinkFieldset['id']> } {
	return link.id != null
}
function linkHasContent(link: LinkFieldset): link is LinkFieldset & {
	source: NonNullable<LinkFieldset['source']>
	url: NonNullable<LinkFieldset['url']>
} {
	return Boolean(link.source && link.url)
}

const AuthorEditorSchema = z.object({
	id: z.string().optional(),
	fullName: z.string().min(minLength).max(maxLength),
	lastFirst: z.string().min(minLength).max(maxLength),
	links: z.array(LinkFieldsetSchema).max(5).optional(),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export async function action({ request }: DataFunctionArgs) {
	debug()

	const userId = await requireUserId(request)

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)
	await validateCSRF(formData, request.headers)

	const submission = await parse(formData, {
		schema: AuthorEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			console.log({ data })

			const author = await prisma.author.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!author) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Author not found',
				})
			}
		}).transform(async ({ links = [], images = [], ...data }) => {
			return {
				...data,
				linkUpdates: await Promise.all(
					links
						.filter(linkHasId)
						.filter(linkHasContent)
						.map(async l => ({
							id: l.id,
							source: l.source,
							url: l.url,
						})),
				),
				newLinks: await Promise.all(
					links
						.filter(linkHasContent)
						.filter(i => !i.id)
						.map(async link => ({
							source: link.source,
							url: link.url,
						})),
				),
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async i => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								contentType: i.file.type,
								blob: Buffer.from(await i.file.arrayBuffer()),
							}
						} else {
							return {
								id: i.id,
								altText: i.altText,
							}
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter(i => !i.id)
						.map(async image => {
							return {
								altText: image.altText,
								contentType: image.file.type,
								blob: Buffer.from(await image.file.arrayBuffer()),
							}
						}),
				),
			}
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ submission } as const)
	}

	if (!submission.value) {
		return json({ submission } as const, { status: 400 })
	}

	const {
		id: authorId,
		fullName,
		lastFirst,
		linkUpdates = [],
		newLinks = [],
		imageUpdates = [],
		newImages = [],
	} = submission.value

	const updatedAuthor = await prisma.author.upsert({
		select: { id: true },
		where: { id: authorId ?? '__new_author__' },
		create: {
			fullName,
			lastFirst,
			links: { create: newLinks },
			createdBy: userId,
			images: { create: newImages },
		},
		update: {
			fullName,
			lastFirst,
			links: {
				deleteMany: { id: { notIn: linkUpdates.map(i => i.id) } },
				updateMany: linkUpdates.map(updates => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.id },
				})),
				create: newLinks,
			},
			images: {
				deleteMany: { id: { notIn: imageUpdates.map(i => i.id) } },
				updateMany: imageUpdates.map(updates => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.blob ? cuid() : updates.id },
				})),
				create: newImages,
			},
		},
	})

	return redirect(`/author/${updatedAuthor.id}`)
}

export function AuthorEditor({
	author,
}: {
	author?: SerializeFrom<
		Pick<Author, 'id' | 'fullName' | 'lastFirst'> & {
			images: Array<Pick<AuthorImage, 'id' | 'altText'>>
		}
	>
}) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'author-editor',
		constraint: getFieldsetConstraint(AuthorEditorSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: AuthorEditorSchema })
		},
		defaultValue: {
			fullName: author?.fullName ?? '',
			lastFirst: author?.lastFirst ?? '',
			images: author?.images ?? [{}],
		},
	})
	const imageList = useFieldList(form.ref, fields.images)
	const linkList = useFieldList(form.ref, fields.links)

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<Form
					method="POST"
					className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
					{...form.props}
					encType="multipart/form-data"
				>
					<AuthenticityTokenInput />
					{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
					<button type="submit" className="hidden" />
					{author ? <input type="hidden" name="id" value={author.id} /> : null}
					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Full Name' }}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.fullName, { ariaAttributes: true }),
							}}
							errors={fields.fullName.errors}
						/>
						<Field
							labelProps={{ children: 'Last name, First name' }}
							inputProps={{
								...conform.textarea(fields.lastFirst, { ariaAttributes: true }),
							}}
							errors={fields.lastFirst.errors}
						/>
						<div>
							<Label>Link</Label>
							<ul className="flex flex-col gap-4">
								{linkList.map((link, index) => (
									<li
										key={link.key}
										className="relative border-b-2 border-muted-foreground"
									>
										<button
											className="absolute right-0 top-0 text-foreground-destructive"
											{...list.remove(fields.links.name, { index })}
										>
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove link {index + 1}</span>
										</button>
									</li>
								))}
							</ul>
						</div>
						<div>
							<Label>Images</Label>
							<ul className="flex flex-col gap-4">
								{imageList.map((image, index) => (
									<li
										key={image.key}
										className="relative border-b-2 border-muted-foreground"
									>
										<button
											className="absolute right-0 top-0 text-foreground-destructive"
											{...list.remove(fields.images.name, { index })}
										>
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove image {index + 1}</span>
										</button>
										<ImageChooser config={image} />
									</li>
								))}
							</ul>
						</div>
						<Button
							className="mt-3"
							{...list.insert(fields.images.name, { defaultValue: {} })}
						>
							<span aria-hidden>
								<Icon name="plus">Image</Icon>
							</span>{' '}
							<span className="sr-only">Add image</span>
						</Button>
					</div>
					<ErrorList id={form.errorId} errors={form.errors} />
					<div className={floatingToolbarClassName}>
						<Button form={form.id} variant="destructive" type="reset">
							Reset
						</Button>
						<StatusButton
							form={form.id}
							type="submit"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
						>
							Submit
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}

function ImageChooser({
	config,
}: {
	config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>
}) {
	const ref = useRef<HTMLFieldSetElement>(null)
	const fields = useFieldset(ref, config)
	const existingImage = Boolean(fields.id.defaultValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.defaultValue ? getAuthorImgSrc(fields.id.defaultValue) : null,
	)
	const [altText, setAltText] = useState(fields.altText.defaultValue ?? '')

	return (
		<fieldset
			ref={ref}
			aria-invalid={Boolean(config.errors?.length) || undefined}
			aria-describedby={config.errors?.length ? config.errorId : undefined}
		>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									<img
										src={previewImage}
										alt={altText ?? ''}
										className="h-32 w-32 rounded-lg object-cover"
									/>
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input
									{...conform.input(fields.id, {
										type: 'hidden',
										ariaAttributes: true,
									})}
								/>
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={event => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...conform.input(fields.file, {
									type: 'file',
									ariaAttributes: true,
								})}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Textarea
						onChange={e => setAltText(e.currentTarget.value)}
						{...conform.textarea(fields.altText, { ariaAttributes: true })}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={config.errorId} errors={config.errors} />
			</div>
		</fieldset>
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
