import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { parseHtml } from "./parse-html"

const mocks = vi.hoisted(() => ({
  autoPlayVideo: true,
}))

vi.mock(import("~/atoms/settings/general"), async (importOriginal) => ({
  ...(await importOriginal()),
  useGeneralSettingKey: ((key: string) =>
    key === "autoPlayVideo" ? mocks.autoPlayVideo : undefined) as never,
}))

const bilibiliPlayer = "https://player.bilibili.com/player.html?aid=113&cid=256&bvid=BV1xx411c7mD"

describe("parseHtml iframe", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    root = null
    container = null
    mocks.autoPlayVideo = true
  })

  const renderIframeSrc = async (html: string) => {
    // Detached, so happy-dom does not load the iframes
    container = document.createElement("div")
    root = createRoot(container)
    await act(async () => {
      root?.render(parseHtml(html).toContent())
    })
    return container.querySelector("iframe")?.getAttribute("src")
  }

  test("keeps embedded players as they are while autoplay is on", async () => {
    expect(await renderIframeSrc(`<iframe src="${bilibiliPlayer}"></iframe>`)).toBe(bilibiliPlayer)
  })

  test("pauses embedded Bilibili players when autoplay is off", async () => {
    mocks.autoPlayVideo = false

    const src = await renderIframeSrc(`<iframe src="${bilibiliPlayer}"></iframe>`)

    expect(new URL(src!).searchParams.get("autoplay")).toBe("false")
    expect(new URL(src!).searchParams.get("bvid")).toBe("BV1xx411c7mD")
  })

  test("leaves other iframes alone when autoplay is off", async () => {
    mocks.autoPlayVideo = false

    expect(await renderIframeSrc(`<iframe src="https://example.com/widget"></iframe>`)).toBe(
      "https://example.com/widget",
    )
  })
})
