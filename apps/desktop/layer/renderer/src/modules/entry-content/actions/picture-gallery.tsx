import {
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
  useMasonryItemWidth,
} from "@follow/components/ui/masonry/contexts.jsx"
import { useMasonryColumn } from "@follow/components/ui/masonry/hooks.js"
import type { MediaModel } from "@follow/models/types"
import type { RenderComponentProps } from "masonic"
import { Masonry } from "masonic"
import { useState } from "react"

import { Media } from "~/components/ui/media/Media"
import { MediaContainerWidthProvider } from "~/components/ui/media/MediaContainerWidthProvider"

const gutter = 24

const Render: React.ComponentType<
  RenderComponentProps<{
    url: string
    type: "photo" | "video"
    height?: number
    width?: number
    blurhash?: string
  }>
> = ({ data }) => {
  const { url, type, height, width, blurhash } = data

  const itemWidth = useMasonryItemWidth()

  return (
    <Media
      thumbnail
      popper
      src={url}
      type={type}
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
export const ImageGallery = ({ images }: { images: MediaModel }) => {
  const { containerRef, currentColumn, currentItemWidth } = useMasonryColumn(gutter)

  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})
  return (
    <div ref={containerRef}>
      <MasonryItemWidthContext value={currentItemWidth}>
        {/* eslint-disable-next-line @eslint-react/no-context-provider */}
        <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
          <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
            <MediaContainerWidthProvider width={currentItemWidth}>
              <Masonry
                items={images ?? []}
                columnGutter={gutter}
                columnWidth={currentItemWidth}
                columnCount={currentColumn}
                overscanBy={2}
                render={Render}
              />
            </MediaContainerWidthProvider>
          </MasonryItemsAspectRatioSetterContext>
        </MasonryItemsAspectRatioContext.Provider>
      </MasonryItemWidthContext>
    </div>
  )
}
