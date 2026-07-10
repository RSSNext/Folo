import { describe, expect, it } from "vitest"

import { sanitizeHTMLString } from "./sanitize"

describe("sanitizeHTMLString", () => {
  it("removes executable markup before readability parses the document", () => {
    const clean = sanitizeHTMLString(`
      <!doctype html>
      <html>
        <body>
          <img src="/image.png" onerror="alert(1)">
          <a href="javascript:alert(2)" onclick="alert(3)">link</a>
          <script>alert(4)</script>
        </body>
      </html>
    `)

    expect(clean).not.toContain("onerror")
    expect(clean).not.toContain("onclick")
    expect(clean).not.toContain("javascript:")
    expect(clean).not.toContain("<script")
    expect(clean).toContain('<img src="/image.png">')
    expect(clean).toContain("<a>link</a>")
  })
})
