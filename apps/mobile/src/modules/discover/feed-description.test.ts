import { describe, expect, test } from "vitest"

import { getFeedDescriptionText } from "./feed-description"

describe("getFeedDescriptionText", () => {
  test("drops inline markup", () => {
    expect(getFeedDescriptionText("Stories from <em>The Show</em>, every <b>week</b>.")).toBe(
      "Stories from The Show, every week.",
    )
  })

  test("joins paragraphs and line breaks into one line", () => {
    expect(
      getFeedDescriptionText(
        '<p>First part.</p><p>Second<br>part with <a href="#">a link</a>.</p>',
      ),
    ).toBe("First part. Second part with a link.")
  })

  test("decodes character references", () => {
    expect(getFeedDescriptionText("Tom &amp; Jerry&#39;s &quot;show&quot;")).toBe(
      `Tom & Jerry's "show"`,
    )
  })

  test("leaves the text of scripts and styles out", () => {
    expect(getFeedDescriptionText("<style>p { color: red }</style>Plain<script>x()</script>")).toBe(
      "Plain",
    )
  })

  test("keeps plain text, including a bare ampersand or less-than sign", () => {
    expect(getFeedDescriptionText("  R&D news\nfor teams < 10 people ")).toBe(
      "R&D news for teams < 10 people",
    )
  })
})
