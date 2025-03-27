import { getGeneralSettings } from "@/src/atoms/settings/general"
import type { SummarySchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import type { SupportedLanguages } from "@/src/lib/language"
import { summaryService } from "@/src/services/summary"

import { getEntry } from "../entry/getter"
import { createImmerSetter, createZustandStore } from "../internal/helper"
import { SummaryGeneratingStatus } from "./enum"

type SummaryModel = Omit<SummarySchema, "createdAt">

interface SummaryData {
  lang?: string
  summary: string
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
          summary: summary.summary,
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
  async generateSummary(entryId: string) {
    const entry = getEntry(entryId)
    if (!entry) return

    const state = get()
    if (state.generatingStatus[entryId] === SummaryGeneratingStatus.Pending) return

    immerSet((state) => {
      state.generatingStatus[entryId] = SummaryGeneratingStatus.Pending
    })

    const { actionLanguage } = getGeneralSettings()

    // Use Our AI to generate summary
    const summary = await apiClient.ai.summary
      .$get({
        query: {
          id: entryId,
          language: actionLanguage as SupportedLanguages,
        },
      })
      .then((summary) => {
        immerSet((state) => {
          if (!summary.data) {
            state.generatingStatus[entryId] = SummaryGeneratingStatus.Error
            return
          }

          state.data[entryId] = {
            lang: actionLanguage,
            summary: summary.data,
            lastAccessed: Date.now(),
          }
          state.generatingStatus[entryId] = SummaryGeneratingStatus.Success
        })

        return summary.data
      })
      .catch((error) => {
        immerSet((state) => {
          state.generatingStatus[entryId] = SummaryGeneratingStatus.Error
        })
        throw error
      })

    if (summary) {
      summaryActions.upsertMany([
        {
          entryId,
          summary,
          language: actionLanguage ?? null,
        },
      ])
    }

    return summary
  }
}

export const summarySyncService = new SummarySyncService()
