import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { AIIndicator } from "./AISplineButton"

const { setAIPanelVisibilityMock, splineRenderMock, aiState } = vi.hoisted(() => ({
  setAIPanelVisibilityMock: vi.fn(),
  splineRenderMock: vi.fn(),
  aiState: {
    isVisible: false,
    showSplineButton: true,
  },
}))

vi.mock("~/atoms/settings/ai", () => ({
  setAIPanelVisibility: setAIPanelVisibilityMock,
  ["useAIPanelVisibility"]: () => aiState.isVisible,
  ["useAISettingKey"]: (key: string) => {
    if (key === "showSplineButton") {
      return aiState.showSplineButton
    }
    return
  },
}))

vi.mock("~/modules/ai-chat/components/3d-models/AISpline", async () => {
  const React = await import("react")

  return {
    AISpline: () => {
      splineRenderMock()
      return React.createElement("div", { "data-testid": "ai-spline" })
    },
  }
})

vi.mock("~/modules/ai-chat/components/layouts/AISmartSidebar", () => ({
  AISmartSidebar: () => null,
}))

vi.mock("./AIChatFloatingPanel", () => ({
  AIChatFloatingPanel: () => null,
}))

vi.mock("motion/react", async () => {
  const React = await import("react")

  type MotionElementProps = React.HTMLAttributes<HTMLElement> & {
    animate?: unknown
    exit?: unknown
    initial?: unknown
    transition?: unknown
    whileHover?: unknown
    whileTap?: unknown
  }

  const createMotionElement =
    (tag: string) =>
    ({
      ref,
      animate,
      exit,
      initial,
      transition,
      whileHover,
      whileTap,
      ...props
    }: MotionElementProps & { ref?: React.RefObject<HTMLElement | null> }) =>
      React.createElement(tag, { ...props, ref })

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    m: new Proxy(
      {},
      {
        get: (_target, tag) => createMotionElement(String(tag)),
      },
    ),
  }
})

const renderComponent = async () => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)
  await act(async () => {
    root.render(<AIIndicator />)
  })

  return { container, root }
}

describe("AIIndicator", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(() => {
    aiState.isVisible = false
    aiState.showSplineButton = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    container?.remove()
    root = null
    container = null
    vi.clearAllMocks()
  })

  test("renders the Folo bot icon without mounting the Spline scene", async () => {
    ;({ container, root } = await renderComponent())

    expect(container.querySelector("[data-testid='ai-spline']")).toBeNull()
    expect(splineRenderMock).not.toHaveBeenCalled()

    const button = container.querySelector<HTMLButtonElement>("button[title='Open AI Chat']")
    expect(button).not.toBeNull()
    expect(button?.querySelector("i")?.className).toContain("i-mgc-folo-bot-original")
    expect(button?.querySelector("i")?.className).toContain("size-16")

    await act(async () => {
      button?.click()
    })

    expect(setAIPanelVisibilityMock).toHaveBeenCalledWith(true)
  })

  test("keeps the Spline scene unmounted when the user interacts with the AI button", async () => {
    ;({ container, root } = await renderComponent())

    const button = container.querySelector<HTMLButtonElement>("button[title='Open AI Chat']")
    expect(button).not.toBeNull()

    await act(async () => {
      button?.focus()
    })
    await act(async () => {
      button?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }))
    })

    expect(container.querySelector("[data-testid='ai-spline']")).toBeNull()
    expect(splineRenderMock).not.toHaveBeenCalled()
  })

  test("returns to the static idle button after the AI panel closes", async () => {
    ;({ container, root } = await renderComponent())

    const button = container.querySelector<HTMLButtonElement>("button[title='Open AI Chat']")
    await act(async () => {
      button?.focus()
    })
    expect(container.querySelector("[data-testid='ai-spline']")).toBeNull()

    aiState.isVisible = true
    await act(async () => {
      root?.render(<AIIndicator />)
    })
    expect(container.querySelector("button[title='Open AI Chat']")).toBeNull()

    aiState.isVisible = false
    await act(async () => {
      root?.render(<AIIndicator />)
    })

    expect(container.querySelector("[data-testid='ai-spline']")).toBeNull()
  })
})
