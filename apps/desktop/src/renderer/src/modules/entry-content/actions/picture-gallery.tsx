import {
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
  useMasonryItemRatio,
  useMasonryItemWidth,
  useSetStableMasonryItemRatio,
} from "@follow/components/ui/masonry/contexts.jsx"
import { useMasonryColumn } from "@follow/components/ui/masonry/hooks.js"
import type { MediaModel } from "@follow/models/types"
import type { RenderComponentProps } from "masonic"
import { Masonry } from "masonic"
import type { PropsWithChildren } from "react"
import { useEffect, useMemo, useState } from "react"

import { Media, MediaContainerWidthProvider } from "~/components/ui/media"
import { useImageDimensions } from "~/store/image"

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
    <MasonryItemFixedDimensionWrapper url={url}>
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
    </MasonryItemFixedDimensionWrapper>
  )
}
export const ImageGallery = ({ images }: { images: MediaModel }) => {
  const { containerRef, currentColumn, currentItemWidth } = useMasonryColumn(gutter)

  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})
  return (
    <div ref={containerRef}>
      <MasonryItemWidthContext.Provider value={currentItemWidth}>
        <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
          <MasonryItemsAspectRatioSetterContext.Provider value={setMasonryItemsRadio}>
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
          </MasonryItemsAspectRatioSetterContext.Provider>
        </MasonryItemsAspectRatioContext.Provider>
      </MasonryItemWidthContext.Provider>
    </div>
  )
}

const MasonryItemFixedDimensionWrapper = (
  props: PropsWithChildren<{
    url: string
  }>,
) => {
  const { url, children } = props
  const dim = useImageDimensions(url)
  const itemWidth = useMasonryItemWidth()

  const itemHeight = dim ? itemWidth / dim.ratio : itemWidth
  const stableRadio = useState(() => itemWidth / itemHeight || 1)[0]
  const setItemStableRatio = useSetStableMasonryItemRatio()

  const stableRadioCtx = useMasonryItemRatio(url)

  useEffect(() => {
    setItemStableRatio(url, stableRadio)
  }, [setItemStableRatio, stableRadio, url])

  const style = useMemo(
    () => ({
      width: itemWidth,
      height: itemWidth / stableRadioCtx!,
    }),
    [itemWidth, stableRadioCtx],
  )

  if (!style.height) return null

  return (
    <div className="relative flex h-full gap-2 overflow-x-auto overflow-y-hidden" style={style}>
      {children}
    </div>
  )
}
