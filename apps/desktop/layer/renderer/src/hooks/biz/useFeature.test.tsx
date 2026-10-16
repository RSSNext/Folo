import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { useFeature } from "./useFeature"

// Store the overrides before the debug feature atom is created, like a reload after toggling
// them in the debug panel.
vi.hoisted(() => {
  localStorage.setItem("follow:debug-feature", JSON.stringify({ __override: true, ai: true }))
})

const FeatureProbe = () => <output>{String(useFeature("ai"))}</output>

describe("useFeature", () => {
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

  afterAll(() => {
    localStorage.removeItem("follow:debug-feature")
  })

  test("applies the stored debug overrides to every reader of the first render", async () => {
    const element = document.createElement("div")
    document.body.append(element)
    host = element
    root = createRoot(element)
    await act(async () => {
      root?.render(
        <>
          <FeatureProbe />
          <FeatureProbe />
          <FeatureProbe />
        </>,
      )
    })

    expect([...element.querySelectorAll("output")].map((node) => node.textContent)).toEqual([
      "true",
      "true",
      "true",
    ])
  })
})
