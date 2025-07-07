import type { ReactNode } from "react"
import { useCallback, useMemo } from "react"
import { TouchableOpacity } from "react-native"

import { GaleriaContext } from "./context"
import type { GaleriaViewProps } from "./types"

type GaleriaInterface = (({
  children,
  urls,
  theme,
  ids,
}: {
  children: React.ReactNode
} & Partial<Pick<GaleriaContext, "theme" | "ids" | "urls">>) => ReactNode) & {
  Image: (props: GaleriaViewProps) => ReactNode
}

const noop = () => {}

const Galeria: GaleriaInterface = Object.assign(
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
      // const { urls, initialIndex } = use(GaleriaContext)

      return (
        <TouchableOpacity
          onPress={useCallback(() => {
            props.onPreview?.({ nativeEvent: { index: props.index ?? 0 } })
          }, [props])}
        >
          {props.children}
        </TouchableOpacity>
      )
    },
  },
)

export { Galeria }
