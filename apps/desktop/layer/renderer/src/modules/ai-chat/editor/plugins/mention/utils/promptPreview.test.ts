import { initializeDayjs } from "@follow/components/dayjs"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type { LabelTranslator } from "../hooks/dateMentionUtils"
import { formatPromptDateMentions } from "./promptPreview"

const translate = ((key: string) => `t(${key})`) as unknown as LabelTranslator

describe("formatPromptDateMentions", () => {
  beforeAll(() => {
    // The app sets up the dayjs plugins, such as localized formats, when it starts
    initializeDayjs()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-12T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a relative date mention by its label", () => {
    expect(
      formatPromptDateMentions(
        'Summarize <mention-date text="date:relative:today"></mention-date>.',
        translate,
        "en",
      ),
    ).toBe("Summarize t(mentions.date.relative.today.label).")
  })

  it("shows a date mention written as text by the dates it covers", () => {
    const preview = formatPromptDateMentions(
      'Entries within <mention-date text="24hoursago"></mention-date>.',
      translate,
      "en",
    )

    expect(preview).not.toContain("<mention-date")
    expect(preview).toMatch(/^Entries within October 1[12], 2026/)
  })

  it("keeps markup it cannot turn into dates", () => {
    const prompt =
      'Use <mention-feed> for feeds, within <mention-date text="not a date"></mention-date>.'

    expect(formatPromptDateMentions(prompt, translate, "en")).toBe(prompt)
  })
})
