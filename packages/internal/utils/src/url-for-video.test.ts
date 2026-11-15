import { describe, expect, it } from "vitest"

import { disableEmbedAutoPlay, transformVideoUrl } from "./url-for-video"

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

describe("disableEmbedAutoPlay", () => {
  it("pauses the Bilibili player embedded by RSSHub", () => {
    const url = disableEmbedAutoPlay(
      "https://player.bilibili.com/player.html?aid=113&cid=256&bvid=BV1xx411c7mD",
    )
    const params = getSearchParams(url)

    expect(params.get("autoplay")).toBe("false")
    expect(params.get("bvid")).toBe("BV1xx411c7mD")
    expect(params.get("aid")).toBe("113")
  })

  it("handles protocol-relative Bilibili players", () => {
    const url = disableEmbedAutoPlay("//player.bilibili.com/player.html?bvid=BV1xx411c7mD")

    expect(url.startsWith("https://player.bilibili.com/player.html?")).toBe(true)
    expect(getSearchParams(url).get("autoplay")).toBe("false")
  })

  it("overrides autoplay in YouTube embeds", () => {
    expect(
      getSearchParams(
        disableEmbedAutoPlay("https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"),
      ).get("autoplay"),
    ).toBe("0")
    expect(
      getSearchParams(
        disableEmbedAutoPlay("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
      ).get("autoplay"),
    ).toBe("0")
  })

  it("pauses Vimeo and Twitch players", () => {
    expect(
      getSearchParams(disableEmbedAutoPlay("https://player.vimeo.com/video/76979871")).get(
        "autoplay",
      ),
    ).toBe("0")
    expect(
      getSearchParams(
        disableEmbedAutoPlay("https://player.twitch.tv/?channel=folo&parent=app.folo.is"),
      ).get("autoplay"),
    ).toBe("false")
  })

  it("leaves other iframes untouched", () => {
    const src = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    expect(disableEmbedAutoPlay(src)).toBe(src)
    expect(disableEmbedAutoPlay("https://example.com/embed/1")).toBe("https://example.com/embed/1")
    expect(disableEmbedAutoPlay("not a url")).toBe("not a url")
  })
})
