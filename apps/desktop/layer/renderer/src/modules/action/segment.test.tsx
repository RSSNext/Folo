import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test } from "vitest"

const ControlledSegment = ({ value }: { value: string }) => (
  <SegmentGroup value={value}>
    <SegmentItem value="all" label="All" />
    <SegmentItem value="filter" label="Custom Filters" />
  </SegmentGroup>
)

const getTab = (container: HTMLElement, name: string) => {
  const tab = Array.from(container.querySelectorAll<HTMLButtonElement>("[role=tab]")).find(
    (element) => element.textContent?.trim() === name,
  )

  if (!tab) {
    throw new Error(`Tab not found: ${name}`)
  }

  return tab
}

describe("SegmentGroup", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
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
  })

  test("updates the active item when the controlled value changes", async () => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)

    await act(async () => {
      root!.render(<ControlledSegment value="filter" />)
    })

    expect(getTab(container, "Custom Filters").dataset.state).toBe("active")

    await act(async () => {
      root!.render(<ControlledSegment value="all" />)
    })

    expect(getTab(container, "All").dataset.state).toBe("active")
    expect(getTab(container, "Custom Filters").dataset.state).toBe("inactive")
  })
})
