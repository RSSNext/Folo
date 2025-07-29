import { cn } from "@follow/utils/utils"
import { use } from "react"
import { useContextSelector } from "use-context-selector"

import { Media } from "../../media/Media"
import { MarkdownImageRecordContext, MarkdownRenderActionContext } from "../context"

export const MarkdownInlineImage = (
  props: React.ImgHTMLAttributes<HTMLImageElement> & {
    proxy?: {
      width: number
      height: number
    }
  },
) => {
  const { transformUrl } = use(MarkdownRenderActionContext)
  const populatedUrl = transformUrl(props.src)
  const media = useContextSelector(MarkdownImageRecordContext, (record) =>
    props.src ? record[props.src] : null,
  )

  return (
    <Media
      type="photo"
      {...props}
      loading="lazy"
      src={populatedUrl}
      height={media?.height || props.height}
      width={media?.width || props.width}
      blurhash={media?.blurhash}
      mediaContainerClassName={cn("inline max-w-full rounded-md")}
      popper
      showFallback
      inline
    />
  )
}
