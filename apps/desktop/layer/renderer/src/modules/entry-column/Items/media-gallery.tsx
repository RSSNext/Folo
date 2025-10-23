import { useEntry } from "@follow/store/entry/hooks"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { usePreviewMedia } from "~/components/ui/media/hooks"
import { Media } from "~/components/ui/media/Media"
import { jotaiStore } from "~/lib/jotai"

import { socialMediaContentWidthAtom } from "../atoms/social-media-content-width"

export const MediaGallery = ({
  entryId,
  containerWidth,
}: {
  entryId: string
  containerWidth?: number
}) => {
  const entry = useEntry(entryId, (state) => ({ media: state.media }))
  const media = useMemo(() => entry?.media || [], [entry?.media])

  const previewMedia = usePreviewMedia()

  const isAllMediaSameRatio = useMemo(() => {
    let ratio = 0
    for (const m of media) {
      if (m?.height && m?.width) {
        const currentRatio = m.height / m.width
        if (ratio === 0) {
          ratio = currentRatio
        } else if (ratio !== currentRatio) {
          return false
        }
      } else {
        return false
      }
    }
    return true
  }, [media])

  if (media.length === 0) return null

  // all media has same ratio, use horizontal layout
  if (isAllMediaSameRatio) {
    return (
      <div className="mt-4 flex gap-[8px] overflow-x-auto pb-2">
        {media.map((media, i, mediaList) => {
          const style: Partial<{
            width: string
            height: string
          }> = {}
          const boundsWidth = containerWidth || jotaiStore.get(socialMediaContentWidthAtom)
          if (media.height && media.width) {
            // has 1 picture, max width is container width, but max height is less than window height: 2/3
            if (mediaList.length === 1) {
              style.width = `${boundsWidth}px`
              style.height = `${(boundsWidth * media.height) / media.width}px`
              if (Number.parseInt(style.height) > (window.innerHeight * 2) / 3) {
                style.height = `${(window.innerHeight * 2) / 3}px`
                style.width = `${(Number.parseInt(style.height) * media.width) / media.height}px`
              }
            }
            // has 2 pictures, max width is container half width, and - gap 8px
            else if (mediaList.length === 2) {
              style.width = `${(boundsWidth - 8) / 2}px`
              style.height = `${(((boundsWidth - 8) / 2) * media.height) / media.width}px`
            }
            // has over 2 pictures, max width is container 1/3 width
            else if (mediaList.length > 2) {
              style.width = `${boundsWidth / 3}px`
              style.height = `${((boundsWidth / 3) * media.height) / media.width}px`
            }
          }

          const proxySize = {
            width: Number.parseInt(style.width || "0") * 2 || 0,
            height: Number.parseInt(style.height || "0") * 2 || 0,
          }
          return (
            <Media
              style={style}
              key={media.url}
              src={media.url}
              type={media.type}
              previewImageUrl={media.preview_image_url}
              blurhash={media.blurhash}
              className="size-28 shrink-0 cursor-zoom-in data-[state=loading]:!bg-material-ultra-thick"
              loading="lazy"
              proxy={proxySize}
              onClick={(e) => {
                e.stopPropagation()
                previewMedia(
                  mediaList.map((m) => ({
                    url: m.url,
                    type: m.type,
                    blurhash: m.blurhash,
                    fallbackUrl:
                      m.preview_image_url ?? getImageProxyUrl({ url: m.url, ...proxySize }),
                  })),
                  i,
                )
              }}
            />
          )
        })}
      </div>
    )
  }

  // all media has different ratio, use grid layout
  return (
    <div className="mt-4">
      <div
        className={cn(
          "grid gap-2",
          media.length === 2 && "grid-cols-2",
          media.length === 3 && "grid-cols-2",
          media.length === 4 && "grid-cols-2",
          media.length >= 5 && "grid-cols-3",
        )}
      >
        {media.map((m, i) => {
          const proxySize = {
            width: 400,
            height: 400,
          }

          const style = media.length === 3 && i === 2 ? { gridRow: "span 2" } : {}

          return (
            <Media
              style={style}
              key={m.url}
              src={m.url}
              type={m.type}
              previewImageUrl={m.preview_image_url}
              blurhash={m.blurhash}
              className="aspect-square w-full cursor-zoom-in rounded object-cover"
              loading="lazy"
              proxy={proxySize}
              onClick={(e) => {
                e.stopPropagation()
                previewMedia(
                  media.map((m) => ({
                    url: m.url,
                    type: m.type,
                    blurhash: m.blurhash,
                    fallbackUrl:
                      m.preview_image_url ?? getImageProxyUrl({ url: m.url, ...proxySize }),
                  })),
                  i,
                )
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
