import { entrySyncServices, useEntryStore } from "@follow/store/entry/store"
import type { EntryModel } from "@follow/store/entry/types"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import {
  ReadabilityStatus,
  useEntryInReadabilityStatus,
  useEntryIsInReadability,
} from "~/atoms/readability"
import { resetShowSourceContent } from "~/atoms/source-content"
import { jotaiStore } from "~/lib/jotai"

import { ApplyEntryActions } from "./ApplyEntryActions"
import { SourceContentPanel } from "./SourceContentView"

vi.mock("@follow/shared/env.desktop", () => ({
  env: {
    VITE_API_URL: "https://api.example.com",
    VITE_WEB_URL: "https://app.example.com",
  },
}))

const createEntry = (id: string, settings: EntryModel["settings"]) =>
  ({
    id,
    title: `Entry ${id}`,
    url: `https://example.com/${id}`,
    content: "<p>content</p>",
    readabilityContent: null,
    description: null,
    guid: id,
    author: null,
    authorUrl: null,
    authorAvatar: null,
    insertedAt: new Date(),
    publishedAt: new Date(),
    media: null,
    categories: null,
    attachments: null,
    extra: null,
    language: null,
    feedId: "feed-1",
    inboxHandle: null,
    read: false,
    sources: null,
    settings,
  }) as EntryModel

const ReadabilityProbe = ({ entryId }: { entryId: string }) => {
  const isInReadability = useEntryIsInReadability(entryId)
  const status = useEntryInReadabilityStatus(entryId)

  return <output data-probe="layout">{JSON.stringify({ isInReadability, status })}</output>
}

// Same arrangement as EntryContentImpl: it reads the readability state itself, renders
// ApplyEntryActions (keyed by entry) at the top of the article followed by the content layout,
// and the source content panel after the scroll area. All of them mount in the same commit.
const EntryContentLike = ({ entryId }: { entryId: string }) => {
  const isInReadability = useEntryIsInReadability(entryId)

  return (
    <>
      <output data-probe="content">{JSON.stringify({ isInReadability })}</output>
      <article>
        <ApplyEntryActions entryId={entryId} key={entryId} />
        <ReadabilityProbe entryId={entryId} />
      </article>
      <SourceContentPanel src="about:blank" />
    </>
  )
}

const readProbe = (container: HTMLElement, probe: "content" | "layout"): unknown =>
  JSON.parse(container.querySelector(`[data-probe="${probe}"]`)?.textContent ?? "null")

describe("ApplyEntryActions", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  const render = async (entryId: string) => {
    if (!host) {
      host = document.createElement("div")
      document.body.append(host)
      root = createRoot(host)
    }
    await act(async () => {
      root?.render(
        <Provider store={jotaiStore}>
          <EntryContentLike entryId={entryId} />
        </Provider>,
      )
    })
    return host
  }

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(() => {
    vi.spyOn(entrySyncServices, "fetchEntryReadabilityContent").mockResolvedValue(undefined)
    useEntryStore.setState({
      data: {
        "readability-1": createEntry("readability-1", { readability: true }),
        "readability-2": createEntry("readability-2", { readability: true }),
        "source-1": createEntry("source-1", { sourceContent: true }),
      },
    })
  })

  afterEach(async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
    resetShowSourceContent()
    vi.restoreAllMocks()
  })

  test("shows the readability content when the entry content mounts", async () => {
    const container = await render("readability-1")

    expect(entrySyncServices.fetchEntryReadabilityContent).toHaveBeenCalledWith(
      "readability-1",
      expect.any(Function),
    )
    expect(readProbe(container, "content")).toEqual({ isInReadability: true })
    expect(readProbe(container, "layout")).toEqual({
      isInReadability: true,
      status: ReadabilityStatus.SUCCESS,
    })
  })

  test("shows the readability content after switching to another entry", async () => {
    await render("source-1")
    const container = await render("readability-2")

    expect(readProbe(container, "content")).toEqual({ isInReadability: true })
    expect(readProbe(container, "layout")).toEqual({
      isInReadability: true,
      status: ReadabilityStatus.SUCCESS,
    })
  })

  test("opens the source content panel when the entry content mounts", async () => {
    const container = await render("source-1")

    expect(container.querySelector("iframe")).not.toBeNull()
  })
})
