import type { SummarySchema } from "@follow/database/schemas/types"
import { summaryService } from "@follow/database/services/summary"
import type { SupportedActionLanguage } from "@follow/shared"

import { apiClient } from "../context"
import { getEntry } from "../entry/getter"
import { createImmerSetter, createZustandStore } from "../internal/helper"
import { SummaryGeneratingStatus } from "./enum"

type SummaryModel = Omit<SummarySchema, "createdAt">

interface SummaryData {
  lang?: string
  summary: string
  readabilitySummary: string | null
  lastAccessed: number
}

interface SummaryState {
  /**
   * Key: entryId
   * Value: SummaryData
   */
  data: Record<string, SummaryData>

  generatingStatus: Record<string, SummaryGeneratingStatus>
}
const emptyDataSet: Record<string, SummaryData> = {}

export const useSummaryStore = createZustandStore<SummaryState>("summary")(() => ({
  data: emptyDataSet,
  generatingStatus: {},
}))

const get = useSummaryStore.getState
const immerSet = createImmerSetter(useSummaryStore)
class SummaryActions {
  async upsertManyInSession(summaries: SummaryModel[]) {
    const now = Date.now()
    summaries.forEach((summary) => {
      immerSet((state) => {
        state.data[summary.entryId] = {
          lang: summary.language ?? undefined,
          summary: summary.summary || state.data[summary.entryId]?.summary || "",
          readabilitySummary:
            summary.readabilitySummary || state.data[summary.entryId]?.readabilitySummary || null,
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

  getSummary(entryId: string) {
    const state = get()
    const summary = state.data[entryId]

    if (summary) {
      immerSet((state) => {
        if (state.data[entryId]) {
          state.data[entryId].lastAccessed = Date.now()
        }
      })
    }

    return summary
  }

  private batchClean() {
    const state = get()
    const entries = Object.entries(state.data)

    if (entries.length <= 10) return

    const sortedEntries = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    const entriesToRemove = sortedEntries.slice(0, entries.length - 10)

    immerSet((state) => {
      entriesToRemove.forEach(([entryId]) => {
        delete state.data[entryId]
      })
    })
  }
}

export const summaryActions = new SummaryActions()

class SummarySyncService {
  private pendingPromises: Record<string, Promise<string>> = {}

  async generateSummary({
    entryId,
    target,
    actionLanguage,
  }: {
    entryId: string
    target: "content" | "readabilityContent"
    actionLanguage: SupportedActionLanguage
  }) {
    const entry = getEntry(entryId)
    if (!entry) return

    const state = get()
    if (state.generatingStatus[entryId] === SummaryGeneratingStatus.Pending)
      return this.pendingPromises[entryId]

    immerSet((state) => {
      state.generatingStatus[entryId] = SummaryGeneratingStatus.Pending
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
          state.data[entryId] = {
            lang: actionLanguage,
            summary: target === "content" ? summary.data || "" : state.data[entryId]?.summary || "",
            readabilitySummary:
              target === "readabilityContent"
                ? summary.data || ""
                : state.data[entryId]?.readabilitySummary || null,
            lastAccessed: Date.now(),
          }
          state.generatingStatus[entryId] = SummaryGeneratingStatus.Success
        })

        return summary.data || ""
      })
      .catch((error) => {
        immerSet((state) => {
          state.generatingStatus[entryId] = SummaryGeneratingStatus.Error
        })

        throw error
      })
      .finally(() => {
        delete this.pendingPromises[entryId]
      })

    this.pendingPromises[entryId] = pendingPromise
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
