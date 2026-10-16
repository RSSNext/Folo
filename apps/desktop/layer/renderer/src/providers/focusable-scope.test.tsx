import { Focusable } from "@follow/components/common/Focusable/Focusable.js"
import { GlobalFocusableProvider } from "@follow/components/common/Focusable/GlobalFocusableProvider.js"
import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
import { Provider } from "jotai"
import * as React from "react"
import { act, useEffect, useRef } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test } from "vitest"

import { jotaiStore } from "~/lib/jotai"

// Mirrors MainDestopLayout: the subscription column focuses its Focusable in a mount effect, and
// the timeline header rendered after it reads the scope in the same commit
const FocusedOnMount = () => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return <Focusable ref={ref} scope="sidebar" tabIndex={-1} />
}

const ScopeProbe = () => <output>{String(useGlobalFocusableHasScope("sidebar"))}</output>

describe("useGlobalFocusableScopeSelector", () => {
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

  test("sees a scope focused by an earlier sibling in the same commit", async () => {
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)

    await act(async () => {
      root!.render(
        <Provider store={jotaiStore}>
          <GlobalFocusableProvider>
            <FocusedOnMount />
            <ScopeProbe />
          </GlobalFocusableProvider>
        </Provider>,
      )
    })

    expect(host.querySelector("output")?.textContent).toBe("true")
  })
})
