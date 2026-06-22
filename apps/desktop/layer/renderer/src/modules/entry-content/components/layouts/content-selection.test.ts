import { describe, expect, test } from "vitest"

import { getArticleRendererContent } from "./content-selection"

describe("getArticleRendererContent", () => {
  test("keeps resolved readability content instead of overriding it with entry content translation", () => {
    expect(
      getArticleRendererContent({
        content: "<article>readability content</article>",
        translationContent: "<p>entry content translation</p>",
      }),
    ).toBe("<article>readability content</article>")
  })
})
