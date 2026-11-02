import { describe, expect, it } from "vitest"

import { findFragmentTarget, isFragmentLink } from "./fragment-target"

const render = (html: string) => {
  const container = document.createElement("article")
  container.innerHTML = html
  return container
}

describe("isFragmentLink", () => {
  it("only matches links within the page", () => {
    expect(isFragmentLink("#section-2")).toBe(true)
    expect(isFragmentLink("https://example.com/#section-2")).toBe(false)
    expect(isFragmentLink("/posts/1#section-2")).toBe(false)
    expect(isFragmentLink(undefined)).toBe(false)
  })
})

describe("findFragmentTarget", () => {
  it("finds an id the sanitizer prefixed on the server and again in the client", () => {
    const container = render(
      `<h2 id="user-content-user-content-section-1">One</h2><h2 id="user-content-user-content-section-2">Two</h2>`,
    )

    expect(findFragmentTarget(container, "#section-2")?.textContent).toBe("Two")
  })

  it("finds the target when the link already carries the prefix", () => {
    const container = render(`<li id="user-content-user-content-fn1">Note</li>`)

    expect(findFragmentTarget(container, "#user-content-fn1")?.textContent).toBe("Note")
  })

  it("finds the target of a percent-encoded fragment", () => {
    const container = render(`<h3 id="user-content-第二章">Chapter</h3>`)

    expect(findFragmentTarget(container, "#%E7%AC%AC%E4%BA%8C%E7%AB%A0")?.textContent).toBe(
      "Chapter",
    )
  })

  it("finds nothing for a missing target or an empty fragment", () => {
    const container = render(`<h2 id="user-content-section-1">One</h2>`)

    expect(findFragmentTarget(container, "#section-9")).toBeNull()
    expect(findFragmentTarget(container, "#")).toBeNull()
  })
})
