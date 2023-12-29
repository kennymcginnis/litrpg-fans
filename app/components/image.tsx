// Image.tsx

import type { FC, ComponentType, ImgHTMLAttributes } from 'react'

type ImageProps<T> = ImgHTMLAttributes<HTMLImageElement> & {
	component?: ComponentType<T>
}

const Image: FC<ImageProps<ImgHTMLAttributes<HTMLImageElement>>> = ({
	component: Component = 'img',
	...props
}) => {
	return <Component {...props} />
}

export default Image
