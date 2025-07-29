import { Resvg } from "@resvg/resvg-js"
import type { ReactElement } from "react"
import type { SatoriOptions } from "satori"
import satori from "satori"

import fonts from "./fonts"

export async function renderToImage(
  node: ReactElement,
  options: {
    width?: number
    height: number
    debug?: boolean
    fonts?: SatoriOptions["fonts"]
  },
) {
  const svg = await satori(node, {
    ...options,
    fonts: options.fonts || fonts,
  })

  const w = new Resvg(svg)
  const image = w.render().asPng()

  return {
    image,
    contentType: "image/png",
  }
}
