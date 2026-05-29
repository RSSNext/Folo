import { useActionStore } from "@follow/store/action/store"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { RuleCard } from "./rule-card"

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>()

  return {
    ...actual,
    ["useTranslation"]: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (typeof options?.count === "number") {
          return `${key}:${options.count}`
        }
        return key
      },
    }),
  }
})

vi.mock("~/components/ui/modal/stacked/hooks", () => ({
  ["useDialog"]: () => ({
    ask: vi.fn(),
  }),
}))

vi.mock("../settings/modal/useSettingModal", () => ({
  ["useSettingModal"]: () => vi.fn(),
}))

describe("RuleCard", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    window.removeEventListener ??= () => {}
  })

  beforeEach(() => {
    useActionStore.setState({
      rules: [],
      isDirty: false,
    })
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

  test("does not crash while a deleted rule card is still mounted", async () => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    const queryClient = new QueryClient()

    await expect(
      act(async () => {
        root!.render(
          <QueryClientProvider client={queryClient}>
            <RuleCard index={0} />
          </QueryClientProvider>,
        )
      }),
    ).resolves.toBeUndefined()
  })
})
