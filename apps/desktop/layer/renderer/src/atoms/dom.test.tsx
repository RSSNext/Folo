import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { setRootContainerElement, useRootContainerElement } from "./dom"

const RootContainerProbe = () => {
  const element = useRootContainerElement()
  return <output>{element?.id ?? "null"}</output>
}

// Mirrors MainDestopLayout: the root container stores its element from a ref callback, and the
// subscription column rendered inside it reads the element in the same commit.
const RootContainer = ({ children }: { children: React.ReactNode }) => (
  <div id="root-container" ref={setRootContainerElement}>
    {children}
  </div>
)

describe("useRootContainerElement", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
  })

  test("reads the element stored by a ref callback of the same commit", async () => {
    const element = document.createElement("div")
    document.body.append(element)
    host = element
    root = createRoot(element)
    await act(async () => {
      root?.render(
        <Provider store={jotaiStore}>
          <RootContainer>
            <RootContainerProbe />
          </RootContainer>
        </Provider>,
      )
    })

    expect(element.querySelector("output")?.textContent).toBe("root-container")
  })
})
