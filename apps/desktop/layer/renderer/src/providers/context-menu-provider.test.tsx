import { GlobalFocusableProvider } from "@follow/components/common/Focusable/GlobalFocusableProvider.js"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { contextMenuAtom, MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { jotaiStore } from "~/lib/jotai"

import { ContextMenuProvider } from "./context-menu-provider"

const { requireLoginMock } = vi.hoisted(() => ({
  requireLoginMock: () => ({
    withLoginGuard: <T extends (...args: never[]) => unknown>(action: T) => action,
  }),
}))

vi.mock("~/hooks/common/useRequireLogin", () => ({
  useRequireLogin: requireLoginMock,
}))

const waitForContextMenuEffects = async () => {
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

const TestMenuTrigger = () => {
  const showContextMenu = useShowContextMenu()

  return (
    <button
      type="button"
      onContextMenu={(event) => {
        event.preventDefault()
        void showContextMenu(
          [
            new MenuItemText({
              label: "Archive",
              click: () => {},
            }),
          ],
          event,
        )
      }}
    >
      Open menu
    </button>
  )
}

const renderProvider = async () => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)
  await act(async () => {
    root.render(
      <Provider store={jotaiStore}>
        <GlobalFocusableProvider>
          <ContextMenuProvider>
            <TestMenuTrigger />
          </ContextMenuProvider>
        </GlobalFocusableProvider>
      </Provider>,
    )
  })

  return { container, root }
}

describe("ContextMenuProvider", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    vi.spyOn(console, "info").mockImplementation(() => {})

    Object.assign(window, {
      clearTimeout,
      Element: document.defaultView?.Element ?? Element,
      getComputedStyle:
        document.defaultView?.getComputedStyle.bind(document.defaultView) ?? getComputedStyle,
      HTMLElement: document.defaultView?.HTMLElement ?? HTMLElement,
      innerHeight: 768,
      innerWidth: 1024,
      Node: document.defaultView?.Node ?? Node,
      setTimeout,
    })
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  afterEach(async () => {
    await act(async () => {
      jotaiStore.set(contextMenuAtom, { open: false })
      await waitForContextMenuEffects()
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

  test("removes the web menu shell when the app menu state closes", async () => {
    ;({ container, root } = await renderProvider())

    const trigger = container.querySelector("button")
    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        }),
      )
      await waitForContextMenuEffects()
    })

    expect(document.querySelector('[role="menu"]')).not.toBeNull()

    await act(async () => {
      jotaiStore.set(contextMenuAtom, { open: false })
      await waitForContextMenuEffects()
    })

    expect(document.querySelector('[role="menu"]')).toBeNull()
  })
})
