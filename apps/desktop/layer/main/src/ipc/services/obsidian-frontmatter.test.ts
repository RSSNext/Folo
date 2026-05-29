import { load } from "js-yaml"
import { describe, expect, it } from "vitest"

import { createObsidianFrontmatter } from "./obsidian-frontmatter"

describe("createObsidianFrontmatter", () => {
  it("serializes multiline descriptions as block scalars and includes integration metadata", () => {
    const frontmatter = createObsidianFrontmatter({
      url: "https://www.techflowpost.com/zh-CN/article/31569",
      author: "Deep Tide TechFlow",
      publishedAt: "2026-05-14T04:20:44.405Z",
      description: [
        "Author: David, Deep Tide TechFlow.",
        "",
        "On May 10, PJ Ace shared an AI short film.",
      ].join("\n"),
      tags: ["folo"],
      feedTitle: "TechFlow",
      feedUrl: "https://www.techflowpost.com/feed",
    })

    expect(frontmatter).toBe(`---
url: "https://www.techflowpost.com/zh-CN/article/31569"
author: "Deep Tide TechFlow"
publishedAt: 2026-05-14T04:20:44
description: |-
  Author: David, Deep Tide TechFlow.

  On May 10, PJ Ace shared an AI short film.
tags:
  - folo
feedTitle: "TechFlow"
feedUrl: "https://www.techflowpost.com/feed"
---`)
    expect(load(frontmatter.replace(/^---\n/, "").replace(/\n---$/, ""))).toEqual({
      url: "https://www.techflowpost.com/zh-CN/article/31569",
      author: "Deep Tide TechFlow",
      publishedAt: new Date("2026-05-14T04:20:44.000Z"),
      description: [
        "Author: David, Deep Tide TechFlow.",
        "",
        "On May 10, PJ Ace shared an AI short film.",
      ].join("\n"),
      tags: ["folo"],
      feedTitle: "TechFlow",
      feedUrl: "https://www.techflowpost.com/feed",
    })
  })

  it("omits optional empty feed metadata", () => {
    expect(
      createObsidianFrontmatter({
        url: "",
        author: "",
        publishedAt: "2026-05-14T04:20:44.405Z",
        tags: ["folo"],
      }),
    ).toBe(`---
url: ""
author: ""
publishedAt: 2026-05-14T04:20:44
tags:
  - folo
---`)
  })
})
