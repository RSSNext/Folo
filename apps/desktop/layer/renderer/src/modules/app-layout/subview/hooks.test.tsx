import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { useSubViewTitle, useSubViewTitleValue } from "./hooks"

vi.mock("@follow/shared/env.desktop", () => ({
  env: {
    VITE_API_URL: "https://api.example.com",
    VITE_WEB_URL: "https://app.example.com",
  },
}))

// Mirrors SubviewLayout: it reads the title and renders the page below it, so the page's effect
// that sets the title runs before the layout subscribes when both mount in the same commit.
const SubviewLayoutLike = ({ children }: { children: React.ReactNode }) => {
  const title = useSubViewTitleValue()

  return (
    <>
      <header>{title}</header>
      {children}
    </>
  )
}

const SubviewPage = ({ title }: { title: string }) => {
  useSubViewTitle(<span>{title}</span>, title)
  return null
}

describe("useSubViewTitleValue", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  const enterSubview = async (title: string) => {
    const element = document.createElement("div")
    document.body.append(element)
    host = element
    root = createRoot(element)
    await act(async () => {
      root?.render(
        <Provider store={jotaiStore}>
          <SubviewLayoutLike>
            <SubviewPage title={title} />
          </SubviewLayoutLike>
        </Provider>,
      )
    })
    return element
  }

  const leaveSubview = async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
  }

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(leaveSubview)

  test("shows the title set by the page when entering a subview", async () => {
    const container = await enterSubview("Discover")

    expect(container.querySelector("header")?.textContent).toBe("Discover")
  })

  test("replaces the title left by the previous subview", async () => {
    await enterSubview("Power")
    await leaveSubview()

    const container = await enterSubview("Actions")

    expect(container.querySelector("header")?.textContent).toBe("Actions")
  })
})
