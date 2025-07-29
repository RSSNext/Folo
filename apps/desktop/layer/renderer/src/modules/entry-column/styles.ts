import { readableContentMaxWidthClassName } from "~/constants/ui"

export const girdClassNames = tw`grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4 @7xl:grid-cols-5 gap-1.5`

// Shared max-width styles for readable content
export const readableContentMaxWidth = tw`${readableContentMaxWidthClassName} mx-auto px-4`
