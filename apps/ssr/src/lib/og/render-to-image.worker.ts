import type { ReactElement } from "react"
import type { SatoriOptions } from "satori"
import satori from "satori"

import { getFonts } from "./fonts.worker"
import { ensureInitialized, Resvg } from "./resvg-wasm-shim"

export async function renderToImage(
  node: ReactElement,
  options: {
    width?: number
    height: number
    debug?: boolean
    fonts?: SatoriOptions["fonts"]
  },
) {
  await ensureInitialized()

  const fonts = options.fonts || (await getFonts())

  const svg = await satori(node, {
    ...options,
    fonts,
  })

  const w = new Resvg(svg)
  const image = w.render().asPng()

  return {
    image,
    contentType: "image/png",
  }
}
