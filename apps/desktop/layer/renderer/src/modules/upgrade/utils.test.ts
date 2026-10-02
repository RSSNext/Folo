import { describe, expect, it } from "vitest"

import { getDesktopReleaseUrl } from "./utils"

describe("getDesktopReleaseUrl", () => {
  it("links to the desktop release tag", () => {
    expect(getDesktopReleaseUrl("https://github.com/RSSNext/Folo", "1.14.0")).toBe(
      "https://github.com/RSSNext/Folo/releases/tag/desktop/v1.14.0",
    )
  })

  it("strips a trailing .git from the repository url", () => {
    expect(getDesktopReleaseUrl("https://github.com/RSSNext/Folo.git", "1.14.0")).toBe(
      "https://github.com/RSSNext/Folo/releases/tag/desktop/v1.14.0",
    )
  })
})
