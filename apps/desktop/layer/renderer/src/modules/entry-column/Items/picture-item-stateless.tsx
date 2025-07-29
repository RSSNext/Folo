import {
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
  useMasonryItemWidth,
} from "@follow/components/ui/masonry/contexts.jsx"
import { Masonry } from "@follow/components/ui/masonry/index.js"
import { useMeasure } from "@follow/hooks"
import { useState } from "react"

import { Media } from "~/components/ui/media/Media"
import { MediaContainerWidthProvider } from "~/components/ui/media/MediaContainerWidthProvider"

import type { EntryItemStatelessProps } from "../types"

const MasonryRender = ({ data }) => {
  const { url, type, previewImageUrl, height, width, blurhash } = data
  const itemWidth = useMasonryItemWidth()

  return (
    <Media
      thumbnail
      src={url}
      type={type}
      previewImageUrl={previewImageUrl}
      className="size-full overflow-hidden"
      mediaContainerClassName={"w-auto h-auto rounded"}
      loading="lazy"
      proxy={{
        width: itemWidth,
        height: 0,
      }}
      height={height}
      width={width}
      blurhash={blurhash}
    />
  )
}

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
    <div className="text-text relative w-full select-none rounded-md transition-colors" ref={ref}>
      <MasonryItemWidthContext value={currentItemWidth}>
        {/* eslint-disable-next-line @eslint-react/no-context-provider */}
        <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
          <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
            <MediaContainerWidthProvider width={currentItemWidth}>
              <Masonry
                items={mediaItems}
                columnGutter={12}
                columnWidth={currentItemWidth}
                columnCount={2}
                overscanBy={2}
                render={MasonryRender}
              />
            </MediaContainerWidthProvider>
          </MasonryItemsAspectRatioSetterContext>
        </MasonryItemsAspectRatioContext.Provider>
      </MasonryItemWidthContext>
    </div>
  )
}
