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

  it.each([
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
    '<svg><p><style><g title="</style><img src=x onerror=alert(1)>">',
    "<table><tbody><tr><td><img src=x onerror=alert(1)></table><script>alert(2)</script>",
    '<svg><a xlink:href="javascript:alert(1)"><text>open</text></a></svg>',
  ])("keeps malformed and foreign markup safe after reparsing: %s", (dirty) => {
    // Parsing sanitized output again models the Electron reader inserting it
    // into a new document, where mutation-XSS payloads can change structure.
    const clean = sanitizeHTMLString(sanitizeHTMLString(dirty))
    expect(clean).not.toMatch(/\bonerror\s*=|<script\b|javascript:/i)
  })

  it("rejects lookalike embeds and strips active attributes from allowed embeds", () => {
    const clean = sanitizeHTMLString(`
      <iframe src="https://youtube.com.evil.example/embed/video"></iframe>
      <iframe src="https://youtube.com@evil.example/embed/video"></iframe>
      <iframe src="https://www.youtube.com/embed/video" onload="alert(1)" srcdoc="<script>alert(2)</script>"></iframe>
    `)
    expect(clean).not.toContain("evil.example")
    expect(clean).not.toMatch(/onload|srcdoc|<script/i)
    expect(clean).toContain('src="https://www.youtube.com/embed/video"')
  })
})
