import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { useRegisterIntegrationCommands } from "./integration"

type RegisteredCommand = {
  icon?: React.ReactNode
  id: string
  run: (input: { entryId: string }) => Promise<void>
}
const state = vi.hoisted(() => ({
  command: undefined as RegisteredCommand | undefined,
  configured: true,
  entry: {
    id: "entry-1",
    title: "Synthetic article",
    url: "https://example.com/article",
    content: "<p>Synthetic content</p>",
    feedId: "feed-1",
  },
  save: vi.fn<() => Promise<{ url: string; warnings: string[] }>>(),
  fetchDetail: vi.fn<() => Promise<void>>(),
  open: vi.fn(),
  loading: vi.fn(() => "toast-1"),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("~/lib/client", () => ({
  ipcServices: {
    notion: { saveArticle: state.save },
    app: { openExternal: state.open },
    integration: { setEagleContextMenuEnabled: async () => {} },
  },
}))
vi.mock("~/modules/integration/notion-status", () => ({
  useNotionStatus: () => ({ data: { configured: state.configured } }),
}))
vi.mock("../hooks/use-register-command", () => ({
  useRegisterCommandEffect: (commands: RegisteredCommand | RegisteredCommand[]) => {
    const command = (Array.isArray(commands) ? commands : [commands]).find(
      (item) => item.id === "integration:save-to-notion",
    )
    if (command) state.command = command
  },
}))
vi.mock("@follow/shared/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@follow/shared/constants")>()),
  IN_ELECTRON: true,
}))
vi.mock("@follow/store/entry/getter", () => ({ getEntry: () => state.entry }))
vi.mock("@follow/store/entry/store", () => ({
  entrySyncServices: { fetchEntryDetail: state.fetchDetail },
}))
vi.mock("@follow/store/feed/getter", () => ({ getFeedById: () => ({ title: "Synthetic feed" }) }))
vi.mock("@follow/store/summary/getters", () => ({ getSummary: () => undefined }))
vi.mock("@follow/tracker", () => ({ tracker: { integration: vi.fn() } }))
vi.mock("~/atoms/readability", () => ({
  getReadabilityStatus: () => ({}),
  ReadabilityStatus: { SUCCESS: 3 },
}))
vi.mock("~/atoms/settings/general", () => ({ getActionLanguage: () => "en" }))
vi.mock("~/atoms/settings/integration", () => ({
  useIntegrationSettingKey: () => false,
  getIntegrationSettings: () => ({}),
}))
vi.mock("~/hooks/biz/useRouteParams", () => ({ useRouteParams: () => ({}) }))
vi.mock("~/modules/integration/custom-integration-manager", () => ({
  CustomIntegrationManager: {},
}))
vi.mock("~/modules/integration/entry-content-markdown", () => ({
  getEntryContentAsMarkdown: vi.fn(),
}))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("sonner", () => ({
  toast: {
    loading: state.loading,
    success: state.success,
    warning: state.warning,
    error: state.error,
  },
}))

const Probe = () => {
  useRegisterIntegrationCommands()
  return null
}

describe("Notion save command", () => {
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
    state.command = undefined
    state.configured = true
    state.entry.content = "<p>Synthetic content</p>"
    state.save.mockResolvedValue({ url: "https://www.notion.so/page", warnings: [] })
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      )
    })
  })
  it("renders a visible vector icon for the Notion menu command", async () => {
    await act(async () => {
      root.render(<span>{state.command?.icon}</span>)
    })
    const svg = host.querySelector("svg")!
    expect(svg.getAttribute("width")).toBe("1em")
    expect(svg.getAttribute("height")).toBe("1em")
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24")
    expect(svg.querySelector("path")?.getAttribute("d")?.length).toBeGreaterThan(100)
    expect(svg.querySelector("path")?.getAttribute("fill")).toBe("currentColor")
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    host.remove()
    client.clear()
  })

  it("sends the article and offers a safe link after successful saving", async () => {
    await state.command!.run({ entryId: "entry-1" })
    expect(state.save).toHaveBeenCalledWith({
      title: "Synthetic article",
      url: "https://example.com/article",
      content: "<p>Synthetic content</p>",
      feedTitle: "Synthetic feed",
    })
    expect(state.success).toHaveBeenCalledWith(
      "entry_actions.saved_to_notion",
      expect.objectContaining({ id: "toast-1" }),
    )
    const options = state.success.mock.calls[0]![1] as { action: { onClick: () => void } }
    options.action.onClick()
    expect(state.open).toHaveBeenCalledWith("https://www.notion.so/page")
  })

  it("shows partial save warnings and does not expose unsafe result links", async () => {
    state.save.mockResolvedValue({
      url: "https://notion.so.attacker.example/page",
      warnings: ["body incomplete"],
    })
    await state.command!.run({ entryId: "entry-1" })
    expect(state.warning).toHaveBeenCalledWith("entry_actions.saved_to_notion_with_warnings", {
      id: "toast-1",
      action: undefined,
    })
    expect(state.success).not.toHaveBeenCalled()
  })

  it("suppresses duplicate in-flight clicks and allows a subsequent deliberate save", async () => {
    let finish: ((value: { url: string; warnings: string[] }) => void) | undefined
    state.save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const first = state.command!.run({ entryId: "entry-1" })
    await state.command!.run({ entryId: "entry-1" })
    expect(state.save).toHaveBeenCalledOnce()
    finish!({ url: "https://notion.so/page", warnings: [] })
    await first
    await state.command!.run({ entryId: "entry-1" })
    expect(state.save).toHaveBeenCalledTimes(2)
  })

  it("fetches missing content before sending and reports failures without provider secrets", async () => {
    state.entry.content = ""
    state.fetchDetail.mockImplementationOnce(async () => {
      state.entry.content = "<p>Fetched</p>"
    })
    state.save.mockRejectedValue(new Error("synthetic-secret"))
    await state.command!.run({ entryId: "entry-1" })
    expect(state.fetchDetail).toHaveBeenCalledWith("entry-1")
    expect(state.save).toHaveBeenCalledWith(expect.objectContaining({ content: "<p>Fetched</p>" }))
    expect(state.error).toHaveBeenCalledWith("entry_actions.failed_to_save_to_notion", {
      id: "toast-1",
    })
  })
})
