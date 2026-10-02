import { describe, expect, it } from "vitest"

import { convertHtmlToIntegrationMarkdown } from "./entry-content-markdown"

describe("convertHtmlToIntegrationMarkdown", () => {
  it("serializes strikethrough instead of falling back to the raw HTML", async () => {
    await expect(
      convertHtmlToIntegrationMarkdown(
        "<p>Price: <del>$10</del> <s>$8</s> <strike>$6</strike> $5</p>",
      ),
    ).resolves.toBe("Price: ~~$10~~ ~~$8~~ ~~$6~~ $5\n")
  })
})
