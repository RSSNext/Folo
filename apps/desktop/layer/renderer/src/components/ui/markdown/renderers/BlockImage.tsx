import { cn } from "@follow/utils/utils"
import { use } from "react"
import { useContextSelector } from "use-context-selector"

import { useWrappedElementSize } from "~/providers/wrapped-element-provider"

import { Media } from "../../media/Media"
import { MarkdownImageRecordContext, MarkdownRenderActionContext } from "../context"

export const MarkdownBlockImage = (
  props: React.ImgHTMLAttributes<HTMLImageElement> & {
    proxy?: {
      width: number
      height: number
    }
  },
) => {
  const size = useWrappedElementSize()

  const { transformUrl } = use(MarkdownRenderActionContext)
  const src = transformUrl(props.src)

  const media = useContextSelector(MarkdownImageRecordContext, (record) =>
    props.src ? record[props.src] : null,
  )

  return (
    <Media
      type="photo"
      {...props}
      loading="lazy"
      src={src}
      height={media?.height || props.height}
      width={media?.width || props.width}
      blurhash={media?.blurhash}
      mediaContainerClassName={cn(
        "rounded",
        size.w < Number.parseInt(props.width as string) && "w-full",
      )}
      showFallback
      popper
      className="my-8 flex justify-center"
    />
  )
}
