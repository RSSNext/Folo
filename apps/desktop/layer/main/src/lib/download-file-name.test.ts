import { describe, expect, it } from "vitest"

import { getDownloadFileName } from "./download-file-name"

describe("getDownloadFileName", () => {
  it("leaves out the query string and the fragment", () => {
    expect(getDownloadFileName("http://localhost:47920/local.png?width=1200&format=webp")).toBe(
      "local.png",
    )
    expect(getDownloadFileName("https://example.com/a/photo.jpg#large")).toBe("photo.jpg")
  })

  it("decodes percent-encoded names", () => {
    expect(getDownloadFileName("http://localhost:47920/%E5%9B%BE%E7%89%87%20test.png")).toBe(
      "图片 test.png",
    )
  })

  it("keeps a malformed escape as it is", () => {
    expect(getDownloadFileName("https://example.com/100%.png")).toBe("100%.png")
  })

  it("never suggests a path or a name file systems reject", () => {
    expect(getDownloadFileName("https://example.com/a%2F..%2Fb%3A%3F.png")).toBe("a_.._b__.png")
    expect(getDownloadFileName("https://example.com/%2E%2E")).toBe("download")
  })

  it("falls back to a generic name when the path has none", () => {
    expect(getDownloadFileName("https://img.example.com/?url=photo.jpg")).toBe("download")
    expect(getDownloadFileName("https://example.com/images/")).toBe("download")
    expect(getDownloadFileName("not a url")).toBe("not a url")
    expect(getDownloadFileName("")).toBe("download")
  })
})
