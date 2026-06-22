import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { EntryReadHistory } from "./EntryReadHistory"

const { useEntryReadHistoryMock, useWhoamiMock } = vi.hoisted(() => ({
  useEntryReadHistoryMock: vi.fn(),
  useWhoamiMock: vi.fn(),
}))

vi.mock("@follow/components/ui/avatar-group/index.js", () => ({
  AvatarGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-group">{children}</div>
  ),
}))

vi.mock("@follow/store/entry/hooks", () => ({
  useEntryReadHistory: useEntryReadHistoryMock,
}))

vi.mock("@follow/store/user/hooks", () => ({
  useWhoami: useWhoamiMock,
}))

vi.mock("~/hooks/biz/useRouteParams", () => ({
  getRouteParams: vi.fn(() => ({ view: 0 })),
}))

vi.mock("~/providers/app-grid-layout-container-provider", () => ({
  useAppLayoutGridContainerWidth: vi.fn(() => 800),
}))

vi.mock("./EntryUser", () => ({
  EntryUser: ({ userId }: { userId: string }) => <span data-testid="entry-user">{userId}</span>,
}))

const renderComponent = async (element: React.ReactNode) => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(element)
  })

  return { container, root }
}

describe("EntryReadHistory", () => {
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
    vi.clearAllMocks()
  })

  test("renders nothing when read history has no displayable users", async () => {
    useWhoamiMock.mockReturnValue({ id: "me" })
    useEntryReadHistoryMock.mockReturnValue({
      entryReadHistories: {
        userIds: ["me"],
      },
      total: 1,
    })
    ;({ container, root } = await renderComponent(<EntryReadHistory entryId="entry-1" />))

    expect(container?.innerHTML).toBe("")
  })

  test("renders nothing when read history is unavailable", async () => {
    useWhoamiMock.mockReturnValue({ id: "me" })
    useEntryReadHistoryMock.mockReturnValue({
      total: 0,
    })
    ;({ container, root } = await renderComponent(<EntryReadHistory entryId="entry-1" />))

    expect(container?.innerHTML).toBe("")
  })

  test("renders users when read history has other readers", async () => {
    useWhoamiMock.mockReturnValue({ id: "me" })
    useEntryReadHistoryMock.mockReturnValue({
      entryReadHistories: {
        userIds: ["me", "reader-1"],
      },
      total: 2,
    })
    ;({ container, root } = await renderComponent(<EntryReadHistory entryId="entry-1" />))

    expect(container?.querySelector('[data-testid="avatar-group"]')).not.toBeNull()
    expect(container?.querySelector('[data-testid="entry-user"]')?.textContent).toBe("reader-1")
  })
})
