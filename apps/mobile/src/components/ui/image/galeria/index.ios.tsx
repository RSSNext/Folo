import { requireNativeView } from "expo"
import { use, useMemo } from "react"
import { Image } from "react-native"

import { GaleriaContext } from "./context"
import type { GaleriaViewProps } from "./types"

const NativeImage = requireNativeView<
  GaleriaViewProps & {
    urls?: string[]
  }
>("FollowGaleria")

const noop = () => {}

const Galeria = Object.assign(
  function Galeria({
    children,
    urls,
    theme = "dark",
    ids,
  }: {
    children: React.ReactNode
  } & Partial<Pick<GaleriaContext, "theme" | "ids" | "urls">>) {
    return (
      <GaleriaContext
        value={useMemo(
          () => ({
            urls,
            theme,
            initialIndex: 0,
            open: false,
            src: "",
            setOpen: noop,
            ids,
          }),
          [urls, theme, ids],
        )}
      >
        {children}
      </GaleriaContext>
    )
  },
  {
    Image(props: GaleriaViewProps) {
      const { urls, initialIndex } = use(GaleriaContext)
      return (
        <NativeImage
          onPreview={props.onPreview}
          onClosePreview={props.onClosePreview}
          onIndexChange={props.onIndexChange}
          urls={urls?.map((url) => {
            if (typeof url === "string") {
              return url
            }

            return Image.resolveAssetSource(url).uri
          })}
          index={initialIndex}
          {...props}
        />
      )
    },
    Popup: (() => null) as React.FC<{
      disableTransition?: "web"
    }>,
  },
)

export { Galeria }
