import type { EntryModel } from "@follow/store/entry/types"
import { describe, expect, it } from "vitest"

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
