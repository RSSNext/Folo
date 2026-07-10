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

  it("keeps youtube embed iframes and strips any other iframe", () => {
    const clean = sanitizeHTMLString(`
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="640" height="360"></iframe>
      <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>
      <iframe src="https://evil.example.com/embed"></iframe>
      <iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>
    `)

    expect(clean).toContain("https://www.youtube.com/embed/dQw4w9WgXcQ")
    expect(clean).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    expect(clean).not.toContain("evil.example.com")
    expect(clean).not.toContain("watch?v=")
  })
})
