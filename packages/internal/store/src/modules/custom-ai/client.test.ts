import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { useEntryStore } from "../entry/store"
import type { EntryModel } from "../entry/types"
import { summarySyncService, useSummaryStore } from "../summary/store"
import {
  chatCompletion,
  CustomAIError,
  customAITranslateEntries,
  htmlToText,
  listCustomAIModels,
} from "./client"
import type { CustomAIConfig } from "./store"
import { createDefaultCustomAIConfig, isCustomAIReady, setCustomAIConfig } from "./store"

vi.mock("@follow/database/services/summary", () => ({
  summaryService: {
    getAllSummaries: vi.fn(),
    insertSummary: vi.fn(),
    reset: vi.fn(),
  },
}))

const config: CustomAIConfig = {
  enabled: true,
  baseURL: "https://api.example.com/v1/",
  apiKey: " sk-test ",
  model: "test-model",
}

const replyWith = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  setCustomAIConfig(config)
})

afterEach(() => {
  vi.unstubAllGlobals()
  setCustomAIConfig(createDefaultCustomAIConfig())
})

const requestBody = (call: number) =>
  JSON.parse(fetchMock.mock.calls[call]![1]!.body as string) as {
    model: string
    messages: { role: string; content: string }[]
  }

describe("isCustomAIReady", () => {
  test("needs the switch, an address and a model", () => {
    expect(isCustomAIReady(config)).toBe(true)
    expect(isCustomAIReady({ ...config, enabled: false })).toBe(false)
    expect(isCustomAIReady({ ...config, model: " " })).toBe(false)
    expect(isCustomAIReady({ ...config, baseURL: "" })).toBe(false)
    // A local server such as Ollama needs no key
    expect(isCustomAIReady({ ...config, apiKey: "" })).toBe(true)
  })
})

describe("htmlToText", () => {
  test("drops markup and decodes entities", () => {
    expect(
      htmlToText(
        "<style>p{}</style><h1>Title</h1><p>A &amp; B&nbsp;&#x4e2d;&#25991;</p><p>line<br/>break</p>",
      ),
    ).toBe("Title\nA & B 中文\nline\nbreak")
  })
})

describe("chatCompletion", () => {
  test("posts to the chat completions endpoint with the key and model", async () => {
    fetchMock.mockResolvedValueOnce(replyWith("<think>hmm</think>\n```\nHello\n```"))

    await expect(chatCompletion([{ role: "user", content: "hi" }])).resolves.toBe("Hello")

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://api.example.com/v1/chat/completions")
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer sk-test")
    expect(requestBody(0).model).toBe("test-model")
  })

  test("leaves out the authorization header without a key", async () => {
    fetchMock.mockResolvedValueOnce(replyWith("OK"))

    await chatCompletion([{ role: "user", content: "hi" }], { ...config, apiKey: "" })

    expect(fetchMock.mock.calls[0]![1]!.headers).not.toHaveProperty("authorization")
  })

  test("reports the API's error message", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 }),
    )

    const error = await chatCompletion([{ role: "user", content: "hi" }]).catch((e) => e)
    expect(error).toBeInstanceOf(CustomAIError)
    expect(error.message).toBe("HTTP 401: Invalid API key")
    expect(error.status).toBe(401)
  })
})

describe("listCustomAIModels", () => {
  test("returns the sorted model IDs", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: "b" }, { id: "a" }, { name: "x" }] })),
    )

    await expect(listCustomAIModels(config)).resolves.toEqual(["a", "b"])
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.example.com/v1/models")
  })
})

describe("customAITranslateEntries", () => {
  test("translates titles in one request and each content on its own", async () => {
    fetchMock
      .mockResolvedValueOnce(
        replyWith('Sure:\n{"e1.title":"标题一","e2.title":"标题二","e2.description":"描述二"}'),
      )
      .mockResolvedValueOnce(replyWith("<p>内容一</p>"))

    const onTranslated = vi.fn()
    await customAITranslateEntries({
      entries: [
        { id: "e1", title: "Title one", content: "<p>Content one</p>" },
        { id: "e2", title: "Title two", description: "Description two" },
      ],
      fields: ["title", "description", "content"],
      language: "zh-CN",
      mode: "translation-only",
      onTranslated,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(requestBody(0).messages[1]!.content)).toEqual({
      "e1.title": "Title one",
      "e2.title": "Title two",
      "e2.description": "Description two",
    })
    expect(requestBody(0).messages[0]!.content).toContain("Simplified Chinese")
    expect(onTranslated.mock.calls).toEqual([
      ["e1", { title: "标题一" }],
      ["e2", { title: "标题二", description: "描述二" }],
      ["e1", { content: "<p>内容一</p>" }],
    ])
  })
})

describe("summarySyncService with the user's own API", () => {
  const entryId = "entry-1"
  const summaryApiMock = vi.fn()

  beforeEach(() => {
    summaryApiMock.mockReset()
    useEntryStore.setState({
      data: {
        [entryId]: {
          id: entryId,
          guid: "guid",
          title: "An article",
          content: "<p>Some long article text.</p>",
          insertedAt: new Date("2026-01-01T00:00:00.000Z"),
          publishedAt: new Date("2026-01-01T00:00:00.000Z"),
        } as EntryModel,
      },
    })
    useSummaryStore.setState({ data: {}, generatingStatus: {} })
    apiContext.provide({ ai: { summary: summaryApiMock } } as unknown as FollowAPI)
  })

  test("summarizes through the user's API instead of the Folo server", async () => {
    fetchMock.mockResolvedValueOnce(replyWith("A short summary."))

    await expect(
      summarySyncService.generateSummary({ entryId, target: "content", actionLanguage: "en" }),
    ).resolves.toBe("A short summary.")

    expect(summaryApiMock).not.toHaveBeenCalled()
    expect(requestBody(0).messages[1]!.content).toBe("Title: An article\n\nSome long article text.")
    expect(useSummaryStore.getState().data[entryId]?.en?.summary).toBe("A short summary.")
  })

  test("uses the Folo server while the user's API is off", async () => {
    setCustomAIConfig({ ...config, enabled: false })
    summaryApiMock.mockResolvedValueOnce({ data: "Server summary." })

    await expect(
      summarySyncService.generateSummary({ entryId, target: "content", actionLanguage: "en" }),
    ).resolves.toBe("Server summary.")

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
