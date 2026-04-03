import { describe, expect, it } from "vitest"

import { getBottomPanelContainerStyle } from "./ChatBottomPanel.styles"

describe("getBottomPanelContainerStyle", () => {
  it("returns no extra transform after the chat has messages", () => {
    expect(
      getBottomPanelContainerStyle({
        centerInputOnEmpty: true,
        hasMessages: true,
        visualOffsetY: "clamp(-10vh, -8vh, -6vh)",
      }),
    ).toBeUndefined()
  })

  it("uses the base centered transform when no visual offset is provided", () => {
    expect(
      getBottomPanelContainerStyle({
        centerInputOnEmpty: true,
        hasMessages: false,
      }),
    ).toEqual({
      transform: "translateY(calc(100% + 1rem))",
    })
  })

  it("merges the visual offset into the centered transform", () => {
    expect(
      getBottomPanelContainerStyle({
        centerInputOnEmpty: true,
        hasMessages: false,
        visualOffsetY: "clamp(-10vh, -8vh, -6vh)",
      }),
    ).toEqual({
      transform: "translateY(calc(100% + 1rem + clamp(-10vh, -8vh, -6vh)))",
    })
  })
})
