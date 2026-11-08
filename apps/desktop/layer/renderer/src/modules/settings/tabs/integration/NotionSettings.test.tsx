import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { NotionSettings } from "./NotionSettings"

const state = vi.hoisted(() => ({
  configured: false,
  statusError: false,
  dataSourceId: "",
  configure: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  getMapping: vi.fn(async () => ({
    properties: [
      { id: "t", name: "Name", type: "title" },
      { id: "u", name: "Link", type: "url" },
      { id: "c", name: "Created time", type: "created_time" },
      { id: "e", name: "Last edited time", type: "last_edited_time" },
    ],
    mapping: { url: "u" } as Partial<Record<"url" | "author" | "publishedAt", string>>,
  })),
  setMapping: vi.fn(async () => {}),
  disconnect: vi.fn<() => Promise<void>>(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock("~/modules/integration/notion-local", () => ({
  notionLocalClient: {
    getStatus: async () => {
      if (state.statusError) throw new Error("NOTION_LOCAL_STORAGE_INVALID")
      return { configured: state.configured, dataSourceId: state.dataSourceId }
    },
    beginSelection: state.configure,
    cancelSelection: async () => {},
    selectSource: async (id: string) => {
      state.configured = true
      state.dataSourceId = id
    },
    getMapping: state.getMapping,
    setMapping: state.setMapping,
    disconnect: state.disconnect,
  },
}))
vi.mock("@follow/shared/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@follow/shared/constants")>()),
  IN_ELECTRON: true,
}))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("sonner", () => ({ toast: { success: state.success, error: state.error } }))

describe("NotionSettings", () => {
  let root: Root
  let host: HTMLDivElement
  let client: QueryClient

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    state.configured = false
    state.statusError = false
    state.dataSourceId = ""
    state.configure.mockResolvedValue({
      items: [{ id: "synthetic-source", title: "Notes", databaseId: "db" }],
      nextCursor: null,
    })
    state.disconnect.mockImplementation(async () => {
      state.configured = false
      state.dataSourceId = ""
    })
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <NotionSettings />
        </QueryClientProvider>,
      )
    })
  })

  it("uses the shared accessible selector for database selection", async () => {
    await fill("synthetic-token", "")
    await submit()
    expect(host.querySelector('[role="combobox"]')?.tagName).toBe("BUTTON")
  })

  it("loads compatible mappings and saves them", async () => {
    await fill("secret", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    await submit()
    await choose()
    await act(async () => {
      await client.refetchQueries()
    })
    const button = () =>
      [...host.querySelectorAll("button")].find(
        (b) => b.textContent === "integration.notion.mapping",
      )!
    await act(async () => {
      button().click()
    })
    expect(state.getMapping).toHaveBeenCalled()
    expect(
      host.querySelector('[aria-label="integration.notion.mapping_url"]')?.textContent,
    ).toContain("Link")
    await act(async () => {
      ;[...host.querySelectorAll("button")]
        .find((b) => b.textContent === "integration.notion.mapping_save")!
        .click()
    })
    expect(state.setMapping).toHaveBeenCalledWith({ url: "u" })
  })

  it("explains missing writable dates and refreshes schema without saving", async () => {
    await fill("synthetic", "")
    await submit()
    await choose()
    const click = async (key: string) =>
      act(async () => {
        ;[...host.querySelectorAll("button")].find((b) => b.textContent === key)!.click()
      })
    await click("integration.notion.mapping")
    expect(host.textContent).toContain("integration.notion.mapping_no_date")
    expect(
      [...host.querySelectorAll("option")].some((o) => o.value === "c" || o.value === "e"),
    ).toBe(false)
    await selectOption("integration.notion.mapping_url", "integration.notion.mapping_none")
    await click("integration.notion.mapping_refresh")
    expect(
      host.querySelector('[aria-label="integration.notion.mapping_url"]')?.textContent,
    ).toContain("integration.notion.mapping_none")
    expect(state.getMapping).toHaveBeenCalledTimes(2)
    expect(state.setMapping).not.toHaveBeenCalled()
  })

  it("filters shared mapping selectors and disables properties already assigned elsewhere", async () => {
    state.getMapping.mockResolvedValueOnce({
      properties: [
        { id: "u", name: "Link", type: "url" },
        { id: "d", name: "Published", type: "date" },
        { id: "r", name: "Notes", type: "rich_text" },
        { id: "c", name: "Created time", type: "created_time" },
      ],
      mapping: { url: "missing", author: "r" },
    })
    await fill("synthetic", "")
    await submit()
    await choose()
    await act(async () => {
      ;[...host.querySelectorAll("button")]
        .find((button) => button.textContent === "integration.notion.mapping")!
        .click()
    })
    expect(
      host.querySelector('[aria-label="integration.notion.mapping_url"]')?.textContent,
    ).toContain("integration.notion.mapping_invalid")
    await openSelect("integration.notion.mapping_source")
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    expect(options.some((option) => option.textContent === "Published")).toBe(false)
    expect(options.some((option) => option.textContent === "Created time")).toBe(false)
    expect(
      options.find((option) => option.textContent === "Notes")?.getAttribute("aria-disabled"),
    ).toBe("true")
    await act(async () => {
      document
        .querySelector('[role="listbox"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
    await selectOption("integration.notion.mapping_publishedAt", "Published")
    await act(async () => {
      ;[...host.querySelectorAll("button")]
        .find((button) => button.textContent === "integration.notion.mapping_save")!
        .click()
    })
    expect(state.setMapping).toHaveBeenCalledWith({ url: "missing", author: "r", publishedAt: "d" })
  })

  it("offers explicit disconnect recovery when local credential status fails", async () => {
    state.statusError = true
    await act(async () => {
      await client.refetchQueries()
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    const button = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "integration.notion.disconnect",
    )
    expect(button).toBeDefined()
    state.statusError = false
    await act(async () => {
      button!.click()
    })
    expect(state.disconnect).toHaveBeenCalledOnce()
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    host.remove()
    client.clear()
  })

  const fill = async (token: string, _dataSourceId: string) => {
    await act(async () => {
      const inputs = host.querySelectorAll("input")
      for (const [index, value] of [token].entries()) {
        const input = inputs[index]!
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          value,
        )
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })
  }

  const submit = async () => {
    await act(async () => {
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
  }

  const openSelect = async (label: string) => {
    await act(async () => {
      const trigger = host.querySelector<HTMLButtonElement>(
        `[role="combobox"][aria-label="${label}"]`,
      )!
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    })
  }

  const selectOption = async (label: string, text: string) => {
    await openSelect(label)
    await act(async () => {
      const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
        (element) => element.textContent?.includes(text),
      )!
      expect(option).toBeDefined()
      option.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    })
  }

  const choose = async () => {
    await selectOption("integration.notion.select_database", "Notes")
    await act(async () => {
      ;[...host.querySelectorAll("button")]
        .find((b) => b.textContent === "integration.notion.use_database")!
        .click()
    })
    await act(async () => {
      await client.refetchQueries()
    })
  }

  it("collapses credentials after selection and keeps mapping and disconnect accessible", async () => {
    await fill("synthetic-token", "")
    await submit()
    await choose()
    expect(host.querySelector('input[type="password"]')).toBeNull()
    expect(host.textContent).toContain("integration.notion.mapping")
    expect(host.textContent).toContain("integration.notion.disconnect")
    await act(async () => {
      ;[...host.querySelectorAll("button")]
        .find((b) => b.textContent === "integration.notion.edit_connection")!
        .click()
    })
    expect(host.querySelector('input[type="password"]')).not.toBeNull()
    expect(state.disconnect).not.toHaveBeenCalled()
  })

  it("connects and disconnects without retaining credentials in form state or query cache", async () => {
    const beforeStorage = JSON.stringify(localStorage)
    await fill(" synthetic-token ", " synthetic-source ")
    await submit()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(state.configure).toHaveBeenCalledWith("synthetic-token")
    await choose()

    expect(host.querySelector<HTMLInputElement>('input[type="password"]')?.value || "").toBe("")
    expect(
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      ),
    ).not.toContain("synthetic-token")
    expect(JSON.stringify(localStorage)).toBe(beforeStorage)
    const disconnect = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "integration.notion.disconnect",
    )
    expect(disconnect).toBeDefined()
    await act(async () => {
      disconnect!.click()
    })
    expect(state.disconnect).toHaveBeenCalledOnce()
    expect(state.success).toHaveBeenLastCalledWith("integration.notion.disconnected")
  })

  it("suppresses repeated submissions while configuration is pending", async () => {
    let finish: (() => void) | undefined
    state.configure.mockImplementation(
      () =>
        new Promise<unknown>((resolve) => {
          finish = () => resolve({ items: [], nextCursor: null })
        }),
    )
    await fill("synthetic-token", "synthetic-source")
    await submit()
    await submit()
    expect(state.configure).toHaveBeenCalledOnce()
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
    await act(async () => {
      finish!()
    })
    expect(host.querySelector<HTMLInputElement>('input[type="password"]')?.value || "").toBe("")
  })

  it("clears a rejected token and displays a sanitized error instead of provider details", async () => {
    state.configure.mockRejectedValue(new Error("provider leaked synthetic-token"))
    await fill("synthetic-token", "synthetic-source")
    await submit()
    expect(state.error).toHaveBeenCalledWith("integration.notion.search_failed")
    expect(host.textContent).not.toContain("synthetic-token")
    expect(host.querySelector<HTMLInputElement>('input[type="password"]')?.value || "").toBe("")
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
  })

  it("does not retain a draft credential after the settings component is closed and reopened", async () => {
    await fill("synthetic-token", "synthetic-source")
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <div />
        </QueryClientProvider>,
      )
    })
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <NotionSettings />
        </QueryClientProvider>,
      )
    })
    expect(host.querySelector<HTMLInputElement>('input[type="password"]')?.value || "").toBe("")
    expect(state.configure).not.toHaveBeenCalled()
  })
})
