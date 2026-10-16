import { afterEach, describe, expect, it } from "vitest"

import { isKeyForFocusedControl } from "./use-register-hotkey"

const pressOn = (element: Element, init: KeyboardEventInit) => {
  let result: boolean | undefined
  const listener = (event: Event) => {
    result = isKeyForFocusedControl(event as KeyboardEvent)
  }
  document.addEventListener("keydown", listener)
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }))
  document.removeEventListener("keydown", listener)
  return result
}

const create = (html: string) => {
  const container = document.createElement("div")
  container.innerHTML = html
  document.body.append(container)
  return container.firstElementChild!
}

describe("isKeyForFocusedControl", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("leaves Space and Enter to buttons, switches and fields", () => {
    for (const html of [
      "<button>Options</button>",
      '<button role="switch">Image only</button>',
      '<input type="checkbox" />',
      '<input type="search" />',
      '<div contenteditable="true"></div>',
    ]) {
      const element = create(html)
      expect(pressOn(element, { key: " " }), html).toBe(true)
      expect(pressOn(element, { key: "Enter" }), html).toBe(true)
    }
  })

  it("leaves Enter to a link, but not Space, which does nothing to it", () => {
    // Such as a timeline entry that was just clicked: Space still plays or pauses the audio
    const link = create('<a href="/timeline/articles/all/1">Entry</a>')
    expect(pressOn(link, { key: "Enter" })).toBe(true)
    expect(pressOn(link, { key: " " })).toBe(false)
  })

  it("leaves them to a control that handled them itself, such as a menu item", () => {
    const item = create('<div role="menuitem" tabindex="-1">Edit</div>')
    item.addEventListener("keydown", (event) => event.preventDefault())
    expect(pressOn(item, { key: "Enter" })).toBe(true)
  })

  it("leaves Tab and Shift+Tab to the focused control, so the focus moves on", () => {
    for (const html of [
      "<button>Summarize timeline</button>",
      '<a href="/timeline/articles/all/1">Entry</a>',
      '<input type="search" />',
      '<button role="switch">Image only</button>',
      '<div role="menuitem" tabindex="-1">Edit</div>',
      '<div role="switch" tabindex="0" aria-checked="false"></div>',
    ]) {
      const element = create(html)
      expect(pressOn(element, { key: "Tab" }), html).toBe(true)
      expect(pressOn(element, { key: "Tab", shiftKey: true }), html).toBe(true)
    }
  })

  it("keeps Tab for switching views on the timeline and its lists", () => {
    const region = create('<div role="region" tabindex="-1"></div>')
    expect(pressOn(region, { key: "Tab" })).toBe(false)
    expect(pressOn(region, { key: "Tab", shiftKey: true })).toBe(false)
    expect(pressOn(document.body, { key: "Tab" })).toBe(false)
    // A draggable subscription row, focused after a click
    const feed = create('<div role="button" tabindex="0" aria-roledescription="draggable"></div>')
    expect(pressOn(feed, { key: "Tab" })).toBe(false)
  })

  it("keeps Space and Enter for the app elsewhere, and other keys everywhere", () => {
    const region = create('<div role="region" tabindex="-1"></div>')
    expect(pressOn(region, { key: " " })).toBe(false)
    expect(pressOn(region, { key: "Enter" })).toBe(false)
    // A list item that only looks like a button to assistive technology does not act on Enter
    const listItem = create('<div role="button" tabindex="0">Feed</div>')
    expect(pressOn(listItem, { key: "Enter" })).toBe(false)
    expect(pressOn(document.body, { key: " " })).toBe(false)

    const button = create("<button>Options</button>")
    expect(pressOn(button, { key: "j" })).toBe(false)
    expect(pressOn(button, { key: "Enter", metaKey: true })).toBe(false)
  })
})
