import type { SummarySchema } from "@follow/database/schemas/types"
import { summaryService } from "@follow/database/services/summary"
import type { SupportedActionLanguage } from "@follow/shared"
import { parseHtml } from "@follow/utils/html"

import { apiClient } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { getEntry } from "../entry/getter"
import { SummaryGeneratingStatus } from "./enum"
import type { StatusID } from "./utils"
import { getGenerateSummaryStatusId } from "./utils"

type SummaryModel = Omit<SummarySchema, "createdAt">

interface SummaryData {
  summary: string
  readabilitySummary: string | null
  lastAccessed: number
}

interface SummaryState {
  /**
   * Key: entryId
   * Value: language -> SummaryData
   */
  data: Record<string, Partial<Record<SupportedActionLanguage, SummaryData>>>

  generatingStatus: Record<StatusID, SummaryGeneratingStatus>
}
const emptyDataSet: Record<string, Partial<Record<SupportedActionLanguage, SummaryData>>> = {}

export const useSummaryStore = createZustandStore<SummaryState>("summary")(() => ({
  data: emptyDataSet,
  generatingStatus: {},
}))

const get = useSummaryStore.getState
const set = useSummaryStore.setState
const immerSet = createImmerSetter(useSummaryStore)
class SummaryActions implements Resetable, Hydratable {
  async hydrate() {
    const summaries = await summaryService.getAllSummaries()
    this.upsertManyInSession(summaries)
  }

  upsertManyInSession(summaries: SummaryModel[]) {
    const now = Date.now()
    immerSet((state) => {
      summaries.forEach((summary) => {
        if (!summary.language) return

        if (!state.data[summary.entryId]) {
          state.data[summary.entryId] = {}
        }
        if (!state.data[summary.entryId]![summary.language]) {
          state.data[summary.entryId]![summary.language] = {
            summary: "",
            readabilitySummary: null,
            lastAccessed: now,
          }
        }

        state.data[summary.entryId]![summary.language] = {
          summary: summary.summary || state.data[summary.entryId]![summary.language]!.summary || "",
          readabilitySummary:
            summary.readabilitySummary ||
            state.data[summary.entryId]![summary.language]!.readabilitySummary ||
            null,
          lastAccessed: now,
        }
      })
    })

    this.batchClean()
  }

  async upsertMany(summaries: SummaryModel[]) {
    this.upsertManyInSession(summaries)

    for (const summary of summaries) {
      summaryService.insertSummary(summary)
    }
  }

  getSummary(entryId: string, language: SupportedActionLanguage) {
    const state = get()
    const summary = state.data[entryId]?.[language]

    if (summary) {
      immerSet((state) => {
        if (state.data[entryId]) {
          state.data[entryId]![language]!.lastAccessed = Date.now()
        }
      })
    }

    return summary
  }

  private batchClean() {
    const state = get()
    const entries = Object.entries(state.data)
      .map(([, data]) => data)
      .flatMap((data) => Object.entries(data))

    if (entries.length <= 10) return

    const sortedEntries = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    const entriesToRemove = sortedEntries.slice(0, entries.length - 10)

    immerSet((state) => {
      entriesToRemove.forEach(([entryId]) => {
        delete state.data[entryId]
      })
    })
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set({
        data: emptyDataSet,
        generatingStatus: {},
      })
    })
    tx.persist(() => {
      summaryService.reset()
    })

    await tx.run()
  }
}

export const summaryActions = new SummaryActions()

class SummarySyncService {
  private pendingPromises: Record<StatusID, Promise<string>> = {}

  async generateSummary({
    entryId,
    target,
    actionLanguage,
  }: {
    entryId: string
    target: "content" | "readabilityContent"
    actionLanguage: SupportedActionLanguage
  }): Promise<string | null> {
    const entry = getEntry(entryId)
    if (!entry) return null

    const state = get()
    const existing =
      state.data[entryId]?.[actionLanguage]?.[
        target === "content" ? "summary" : "readabilitySummary"
      ]
    if (existing) {
      return existing
    }

    const statusID = getGenerateSummaryStatusId(entryId, actionLanguage, target)
    if (state.generatingStatus[statusID] === SummaryGeneratingStatus.Pending)
      return this.pendingPromises[statusID] || null

    const content = target === "content" ? entry.content : entry.readabilityContent
    const textLength = content ? parseHtml(content).toText().length : 0
    if (textLength < 100) {
      return null
    }

    immerSet((state) => {
      state.generatingStatus[statusID] = SummaryGeneratingStatus.Pending
    })

    // Use Our AI to generate summary
    const pendingPromise = apiClient()
      .ai.summary.$get({
        query: {
          id: entryId,
          language: actionLanguage,
          target,
        },
      })
      .then((summary) => {
        immerSet((state) => {
          if (!state.data[entryId]) {
            state.data[entryId] = {}
          }

          state.data[entryId][actionLanguage] = {
            summary:
              target === "content"
                ? summary.data || ""
                : state.data[entryId]?.[actionLanguage]?.summary || "",
            readabilitySummary:
              target === "readabilityContent"
                ? summary.data || ""
                : state.data[entryId]?.[actionLanguage]?.readabilitySummary || null,
            lastAccessed: Date.now(),
          }
          state.generatingStatus[statusID] = SummaryGeneratingStatus.Success
        })

        return summary.data || ""
      })
      .catch((error) => {
        immerSet((state) => {
          state.generatingStatus[statusID] = SummaryGeneratingStatus.Error
        })

        throw error
      })
      .finally(() => {
        delete this.pendingPromises[statusID]
      })

    this.pendingPromises[statusID] = pendingPromise
    const summary = await pendingPromise

    if (summary) {
      summaryActions.upsertMany([
        {
          entryId,
          summary: target === "content" ? summary : "",
          language: actionLanguage ?? null,
          readabilitySummary: target === "readabilityContent" ? summary : null,
        },
      ])
    }

    return summary
  }
}

export const summarySyncService = new SummarySyncService()
