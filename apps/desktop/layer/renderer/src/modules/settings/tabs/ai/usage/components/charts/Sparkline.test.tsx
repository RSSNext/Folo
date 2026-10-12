import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Sparkline } from "./Sparkline"

const pathData = (markup: string) => [...markup.matchAll(/ d="([^"]*)"/g)].map((match) => match[1])

describe("Sparkline", () => {
  it("shows a single day of usage as a dot", () => {
    const markup = renderToStaticMarkup(<Sparkline data={[12]} area />)

    expect(markup).toContain("<circle")
    expect(pathData(markup)).toEqual([])
  })

  it("draws a line and an area through every day", () => {
    const markup = renderToStaticMarkup(<Sparkline data={[10, 5]} area />)

    expect(pathData(markup)).toEqual(["M 8,8 L 792,80 L 792,152 L 8,152 Z", "M 8,8 L 792,80"])
  })
})
