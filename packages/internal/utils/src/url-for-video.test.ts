import { describe, expect, it } from "vitest"

import { transformVideoUrl } from "./url-for-video"

const getSearchParams = (url: string | null) => new URL(url!).searchParams

describe("transformVideoUrl", () => {
  it("autoplays Bilibili videos by default", () => {
    const url = transformVideoUrl({
      url: "https://www.bilibili.com/video/BV1xx411c7mD",
      isIframe: true,
    })

    expect(getSearchParams(url).get("autoplay")).toBe("true")
  })

  it("keeps Bilibili videos paused when autoplay is disabled", () => {
    const url = transformVideoUrl({
      url: "https://www.bilibili.com/video/BV1xx411c7mD",
      isIframe: true,
      autoPlay: false,
    })

    expect(getSearchParams(url).get("autoplay")).toBe("false")
  })

  it("autoplays YouTube videos by default", () => {
    const url = transformVideoUrl({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    })

    expect(getSearchParams(url).get("autoplay")).toBe("1")
  })

  it("keeps YouTube videos paused when autoplay is disabled", () => {
    const url = transformVideoUrl({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      autoPlay: false,
    })

    expect(getSearchParams(url).get("autoplay")).toBe("0")
  })

  it("keeps Pornhub videos paused when autoplay is disabled", () => {
    const url = transformVideoUrl({
      url: "https://www.pornhub.com/view_video.php?viewkey=abc123",
      autoPlay: false,
    })

    expect(getSearchParams(url).get("autoplay")).toBe("0")
  })
})
