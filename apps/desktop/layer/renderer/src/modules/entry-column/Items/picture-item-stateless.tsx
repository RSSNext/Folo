import {
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
} from "@follow/components/ui/masonry/contexts.jsx"
import { useMeasure } from "@follow/hooks"
import { useState } from "react"

import { Media } from "~/components/ui/media/Media"
import { MediaContainerWidthProvider } from "~/components/ui/media/MediaContainerWidthProvider"

import type { EntryItemStatelessProps } from "../types"

export function PictureItemStateLess({ entry }: EntryItemStatelessProps) {
  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})

  const [ref, bounds] = useMeasure()
  const mediaItems =
    entry.media?.map((item) => ({
      url: item.url,
      type: item.type,
      previewImageUrl: item.preview_image_url,
      height: item.height,
      width: item.width,
      blurhash: item.blurhash,
    })) || []

  const currentItemWidth = (bounds.width - 12) / 2

  return (
    <div className="relative w-full select-none text-text" ref={ref}>
      <MasonryItemWidthContext value={currentItemWidth}>
        {/* eslint-disable-next-line @eslint-react/no-context-provider */}
        <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
          <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
            <MediaContainerWidthProvider width={currentItemWidth}>
              <Media
                thumbnail
                src={mediaItems[0]?.url}
                type={mediaItems[0]?.type || "photo"}
                previewImageUrl={mediaItems[0]?.previewImageUrl}
                className="size-full overflow-hidden"
                mediaContainerClassName={"w-auto h-auto rounded"}
                loading="lazy"
                proxy={{
                  width: 600,
                  height: 0,
                }}
                blurhash={mediaItems[0]?.blurhash}
              />
            </MediaContainerWidthProvider>
          </MasonryItemsAspectRatioSetterContext>
        </MasonryItemsAspectRatioContext.Provider>
      </MasonryItemWidthContext>
    </div>
  )
}
