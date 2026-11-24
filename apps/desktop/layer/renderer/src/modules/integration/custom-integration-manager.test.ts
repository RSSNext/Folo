import type { EntryModel } from "@follow/store/entry/types"
import { describe, expect, it } from "vitest"

import type { PlaceholderContext } from "./custom-integration-manager"
import { CustomIntegrationManager } from "./custom-integration-manager"

describe("CustomIntegrationManager", () => {
  it("serializes HTML line breaks without markdown hard-break backslashes", async () => {
    const context = await CustomIntegrationManager.buildPlaceholderContext({
      id: "entry-id",
      title: "MegaHouse G.E. Figure",
      url: "https://example.com/detail",
      content:
        'MegaHouse G.E. figure<br>¥990<br><img src="https://example.com/image.png"><br><a target="_blank">APP 内打开</a>',
      description: "",
      author: null,
      publishedAt: new Date("2026-04-30T03:08:59.874Z"),
    } as EntryModel)

    expect(context.contentMarkdown).toBe(`MegaHouse G.E. figure
¥990
![](https://example.com/image.png)
[APP 内打开]()
`)
  })
})

const context: PlaceholderContext = {
  title: "Costs $$5 & $& more",
  url: "https://example.com/",
  contentHtml: "<p>$` and $'</p>",
  contentMarkdown: "$$\nE = mc^2\n$$",
  summary: "",
  author: "a",
  publishedAt: "2026-01-01",
  description: "see [url] and [author]",
}

describe("CustomIntegrationManager.replacePlaceholders", () => {
  it("keeps dollar signs in the values", () => {
    expect(
      CustomIntegrationManager.replacePlaceholders(
        "[title] | [content_html] | [content_markdown]",
        context,
      ),
    ).toBe("Costs $$5 & $& more | <p>$` and $'</p> | $$\nE = mc^2\n$$")
  })

  it("keeps dollar signs with JSON escaping", () => {
    const body = CustomIntegrationManager.replacePlaceholders(
      '{"title":"[title]","content":"[content_markdown]"}',
      context,
      { jsonEscape: true },
    )
    expect(JSON.parse(body)).toEqual({
      title: context.title,
      content: context.contentMarkdown,
    })
  })

  it("does not replace placeholders inside the values", () => {
    expect(CustomIntegrationManager.replacePlaceholders("[description]: [url]", context)).toBe(
      "see [url] and [author]: https://example.com/",
    )
    expect(
      CustomIntegrationManager.replacePlaceholders("[title]", { ...context, title: "[url]" }),
    ).toBe("[url]")
  })

  it("replaces every placeholder and keeps unknown ones", () => {
    expect(
      CustomIntegrationManager.replacePlaceholders("[url] [url] [summary][unknown]", context),
    ).toBe("https://example.com/ https://example.com/ [unknown]")
  })
})
