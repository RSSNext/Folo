import { GlobalFocusableProvider } from "@follow/components/common/Focusable/GlobalFocusableProvider.js"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { dismissPopover, popoverAtom, showPopover } from "~/atoms/popover"
import { jotaiStore } from "~/lib/jotai"

import { PopoverProvider } from "./popover-provider"

const waitForPopoverEffects = async () => {
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

const renderProvider = async () => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)
  await act(async () => {
    root.render(
      <Provider store={jotaiStore}>
        <GlobalFocusableProvider>
          <PopoverProvider>
            <div>App content</div>
          </PopoverProvider>
        </GlobalFocusableProvider>
      </Provider>,
    )
  })

  return { container, root }
}

describe("PopoverProvider", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    vi.spyOn(console, "info").mockImplementation(() => {})

    Object.assign(window, {
      addEventListener: document.defaultView?.addEventListener.bind(document.defaultView),
      clearTimeout,
      Element: document.defaultView?.Element ?? Element,
      getComputedStyle:
        document.defaultView?.getComputedStyle.bind(document.defaultView) ?? getComputedStyle,
      HTMLElement: document.defaultView?.HTMLElement ?? HTMLElement,
      innerHeight: 768,
      innerWidth: 1024,
      Node: document.defaultView?.Node ?? Node,
      removeEventListener: document.defaultView?.removeEventListener.bind(document.defaultView),
      setTimeout,
    })
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  afterEach(async () => {
    await act(async () => {
      jotaiStore.set(popoverAtom, { open: false })
      await waitForPopoverEffects()
    })

    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    container?.remove()
    document.body.innerHTML = ""
    root = null
    container = null
    vi.clearAllMocks()
  })

  test("closes when clicking outside", async () => {
    ;({ container, root } = await renderProvider())

    await act(async () => {
      showPopover({ x: 120, y: 80 }, <div>Share content</div>)
      await waitForPopoverEffects()
    })

    expect(document.body.textContent).toContain("Share content")
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()

    const appContent = Array.from(container.querySelectorAll("div")).find(
      (element) => element.textContent === "App content",
    )
    expect(appContent).not.toBeUndefined()

    await act(async () => {
      for (const eventType of ["pointerdown", "pointerup", "click"]) {
        appContent?.dispatchEvent(
          new PointerEvent(eventType, {
            bubbles: true,
            button: 0,
            cancelable: true,
          }),
        )
      }
      await waitForPopoverEffects()
    })

    expect(jotaiStore.get(popoverAtom).open).toBe(false)
    expect(document.body.textContent).not.toContain("Share content")
  })

  test("keeps the anchor out of the page flow while closed", async () => {
    ;({ container, root } = await renderProvider())

    const getAnchor = () => document.querySelector<HTMLButtonElement>("button[aria-haspopup]")
    expect(getAnchor()?.style.position).toBe("fixed")

    await act(async () => {
      showPopover({ x: 120, y: 80 }, <div>Share content</div>)
      await waitForPopoverEffects()
    })
    expect(getAnchor()?.style.position).toBe("fixed")
    expect(getAnchor()?.style.top).toBe("80px")

    await act(async () => {
      dismissPopover()
      await waitForPopoverEffects()
    })
    expect(getAnchor()?.style.position).toBe("fixed")
  })

  test("gives the focus back to the element it was opened from", async () => {
    ;({ container, root } = await renderProvider())
    const opener = document.createElement("button")
    opener.textContent = "Share"
    document.body.append(opener)
    opener.focus()

    await act(async () => {
      showPopover({ x: 120, y: 80 }, <button type="button">Copy link</button>)
      await waitForPopoverEffects()
    })
    expect(document.activeElement?.textContent).toBe("Copy link")

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      )
      await waitForPopoverEffects()
    })

    expect(jotaiStore.get(popoverAtom).open).toBe(false)
    // The content leaves after its exit animation, and only then hands the focus back
    await act(async () => {
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(opener)
      })
    })
    expect(document.activeElement?.getAttribute("aria-haspopup")).toBeNull()
  })

  test("can reopen after a programmatic dismissal", async () => {
    ;({ container, root } = await renderProvider())

    await act(async () => {
      showPopover({ x: 120, y: 80 }, <div>First popover</div>)
      await waitForPopoverEffects()
    })

    expect(document.body.textContent).toContain("First popover")

    await act(async () => {
      dismissPopover()
      await waitForPopoverEffects()
    })

    expect(document.body.textContent).not.toContain("First popover")

    await act(async () => {
      showPopover({ x: 140, y: 100 }, <div>Second popover</div>)
      await waitForPopoverEffects()
    })

    expect(jotaiStore.get(popoverAtom).open).toBe(true)
    expect(document.body.textContent).toContain("Second popover")
  })
})
