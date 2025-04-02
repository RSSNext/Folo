import { useMemo } from "react"

import { GaleriaContext } from "./context"
import type { Galeria as GaleriaInterface } from "./index.ios"
import type { GaleriaViewProps } from "./types"

const noop = () => {}

const Galeria: typeof GaleriaInterface = Object.assign(
  function Galeria({
    children,
    urls,
    theme = "dark",
    ids,
  }: {
    children: React.ReactNode
  } & Partial<Pick<GaleriaContext, "theme" | "ids" | "urls">>) {
    return (
      <GaleriaContext.Provider
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
      </GaleriaContext.Provider>
    )
  },
  {
    Image(props: GaleriaViewProps) {
      return props.children
    },
  },
) as unknown as typeof GaleriaInterface

export { Galeria }
