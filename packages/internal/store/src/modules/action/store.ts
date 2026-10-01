import { SyncMetaService } from "@follow/database/services/sync-meta"
import type {
  ActionConditionIndex,
  ActionFilterItem,
  ActionId,
  ActionItem as ActionItemRes,
} from "@follow-app/client-sdk"
import { merge } from "es-toolkit/compat"
import { t } from "i18next"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createZustandStore } from "../../lib/helper"
import { registerSyncModel } from "../../sync/model-registry"
import { ensureSyncedThroughEngine } from "../../sync/sync-status"

export type ActionItem = Omit<ActionItemRes, "condition"> & {
  condition: ActionFilterItem[][]
  index: number
}

type ActionStore = {
  rules: ActionItem[]
  isDirty: boolean
}

type ActionRules = ActionItem[]
export type ActionModel = ActionItem

export const useActionStore = createZustandStore<ActionStore>("action")(() => ({
  rules: [],
  isDirty: false,
}))

const immerSet = createImmerSetter(useActionStore)

/**
 * The rules the server confirmed, kept next to the sync engine's own bookkeeping: they are a
 * single document that the change log replaces as a whole, and the engine clears the table
 * when the account changes.
 */
const ACTION_RULES_DOCUMENT_KEY = "model:action"

const normalizeRules = (rules: ActionItemRes[] | null | undefined): ActionItem[] =>
  (rules ?? []).map((rule, index) => {
    const { condition } = rule
    // fix old data
    const finalCondition =
      condition.length === 0 || Array.isArray(condition[0]) ? condition : [condition]

    return {
      ...rule,
      condition: finalCondition as ActionFilterItem[][],
      index,
    }
  })

class ActionSyncService {
  /**
   * @param keepLocalEdits leave rules the user is editing alone and only remember the
   * server's version. Used by the sync engine, which may run while the editor is open.
   */
  async fetchRules(options?: { keepLocalEdits?: boolean }) {
    const res = await api().actions.get()
    if (res.data) {
      await actionActions.setConfirmedRules(normalizeRules(res.data.rules), {
        overwriteLocalEdits: !options?.keepLocalEdits,
      })
    }
    return res
  }

  /**
   * Make sure the rules in the store are current. With the sync engine running they were
   * hydrated from the local database and are kept fresh by the change log, so nothing is
   * requested; otherwise they are fetched.
   */
  async ensureRules() {
    if ((await ensureSyncedThroughEngine()) && actionActions.isLoaded()) return
    await this.fetchRules()
  }

  async saveRules() {
    const { rules, isDirty } = useActionStore.getState()
    if (!isDirty) {
      return null
    }

    const res = await api().actions.put({ rules: rules as any })
    await actionActions.setConfirmedRules(rules, { overwriteLocalEdits: true })
    return res
  }
}

class ActionActions implements Hydratable, Resetable {
  private loaded = false

  /** Whether confirmed rules are in the store, from the local database or from the server. */
  isLoaded() {
    return this.loaded
  }

  async hydrate() {
    try {
      const stored = await SyncMetaService.get(ACTION_RULES_DOCUMENT_KEY)
      if (stored === null) return
      const parsed = JSON.parse(stored) as { rules?: ActionRules }
      if (!Array.isArray(parsed.rules)) return
      immerSet((state) => {
        state.rules = parsed.rules!
        state.isDirty = false
      })
      this.loaded = true
    } catch (error) {
      console.error("[action] failed to load the stored rules", error)
    }
  }

  async reset() {
    this.loaded = false
    immerSet((state) => {
      state.rules = []
      state.isDirty = false
    })
  }

  /**
   * Rules as the server has them. They are always written to the local database; the store
   * follows unless the user has unsaved edits that must not be replaced under their hands.
   */
  async setConfirmedRules(rules: ActionRules, options?: { overwriteLocalEdits?: boolean }) {
    if (options?.overwriteLocalEdits || !useActionStore.getState().isDirty) {
      immerSet((state) => {
        state.rules = rules
        state.isDirty = false
      })
    }
    this.loaded = true

    await SyncMetaService.set(ACTION_RULES_DOCUMENT_KEY, JSON.stringify({ rules })).catch(
      (error) => {
        console.error("[action] failed to store the rules", error)
      },
    )
  }

  updateRules(rules: ActionRules) {
    immerSet((state) => {
      state.rules = rules
      state.isDirty = true
    })
  }

  patchRule(index: number, rule: Partial<ActionModel>) {
    immerSet((state) => {
      if (state.rules[index]) {
        state.rules[index] = merge(state.rules[index], rule)
        state.isDirty = true
      }
    })
  }

  addRule(getName: (index: number) => string) {
    immerSet((state) => {
      state.rules.push({
        name: getName(state.rules.length + 1),
        condition: [],
        index: state.rules.length,
        result: {},
      })
      state.isDirty = true
    })
  }

  pathCondition(index: ActionConditionIndex, condition: Partial<ActionFilterItem>) {
    immerSet((state) => {
      const rule = state.rules[index.ruleIndex]
      if (!rule) return
      const group = rule.condition[index.groupIndex]
      if (!group) return
      group[index.conditionIndex] = merge(group[index.conditionIndex], condition)
      state.isDirty = true
    })
  }

  addConditionItem(index: Omit<ActionConditionIndex, "conditionIndex">) {
    immerSet((state) => {
      const rule = state.rules[index.ruleIndex]
      if (!rule) return
      const group = rule.condition[index.groupIndex]
      if (!group) return
      group.push({})
      state.isDirty = true
    })
  }
  deleteConditionItem(index: ActionConditionIndex) {
    immerSet((state) => {
      const rule = state.rules[index.ruleIndex]
      if (!rule) return
      const group = rule.condition[index.groupIndex]
      if (!group) return
      group.splice(index.conditionIndex, 1)
      if (group.length === 0) {
        rule.condition.splice(index.groupIndex, 1)
      }
      state.isDirty = true
    })
  }

  addConditionGroup(index: Omit<ActionConditionIndex, "conditionIndex" | "groupIndex">) {
    immerSet((state) => {
      const rule = state.rules[index.ruleIndex]
      if (!rule) return
      rule.condition.push([{}])
      state.isDirty = true
    })
  }

  toggleRuleFilter(index: number) {
    immerSet((state) => {
      if (state.rules[index]) {
        const hasCustomFilters = state.rules[index].condition.length > 0
        state.rules[index].condition = hasCustomFilters ? [] : [[{}]]
        state.isDirty = true
      }
    })
  }

  deleteRuleAction(index: number, actionId: ActionId) {
    immerSet((state) => {
      if (state.rules[index]) {
        delete state.rules[index].result[actionId]
        state.isDirty = true
      }
    })
  }

  deleteRule(index: number) {
    immerSet((state) => {
      state.rules.splice(index, 1)
      state.rules.forEach((rule, ruleIndex) => {
        rule.index = ruleIndex
      })
      state.isDirty = true
    })
  }

  setDirty(isDirty: boolean) {
    immerSet((state) => {
      state.isDirty = isDirty
    })
  }

  addWebhook(index: number) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { webhooks } = rule.result
      if (!webhooks) {
        rule.result.webhooks = [""]
      } else {
        webhooks.push("")
      }
      state.isDirty = true
    })
  }

  deleteWebhook(index: number, webhookIndex: number) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { webhooks } = rule.result
      if (!webhooks) return
      if (webhooks.length === 1) {
        delete rule.result.webhooks
      } else {
        webhooks.splice(webhookIndex, 1)
      }
      state.isDirty = true
    })
  }

  updateWebhook({
    index,
    webhookIndex,
    value,
  }: {
    index: number
    webhookIndex: number
    value: string
  }) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { webhooks } = rule.result
      if (!webhooks) return
      webhooks[webhookIndex] = value
      state.isDirty = true
    })
  }

  addRewriteRule(index: number) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { rewriteRules } = rule.result
      if (!rewriteRules) {
        rule.result.rewriteRules = [
          {
            from: "",
            to: "",
          },
        ]
      } else {
        rewriteRules.push({ from: "", to: "" })
      }
      state.isDirty = true
    })
  }

  deleteRewriteRule(index: number, rewriteIdx: number) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { rewriteRules } = rule.result
      if (!rewriteRules) return
      if (rewriteRules.length === 1) {
        delete rule.result.rewriteRules
      } else {
        rewriteRules.splice(rewriteIdx, 1)
      }
      state.isDirty = true
    })
  }

  updateRewriteRule({
    index,
    rewriteRuleIndex,
    key,
    value,
  }: {
    index: number
    rewriteRuleIndex: number
    key: "from" | "to"
    value: string
  }) {
    immerSet((state) => {
      const rule = state.rules[index]
      if (!rule) return
      const { rewriteRules } = rule.result
      if (!rewriteRules) return
      const rewriteRule = rewriteRules[rewriteRuleIndex]
      if (!rewriteRule) return
      rewriteRule[key] = value
      state.isDirty = true
    })
  }

  exportRules(): string {
    const { rules } = useActionStore.getState()
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      rules: rules.map((rule) => ({
        name: rule.name,
        condition: rule.condition,
        result: rule.result,
      })),
    }
    return JSON.stringify(exportData)
  }

  importRules(jsonData: string): { success: boolean; message: string; importedCount?: number } {
    try {
      const parsedData = JSON.parse(jsonData)

      // Validate the structure
      if (!parsedData.rules || !Array.isArray(parsedData.rules)) {
        return {
          success: false,
          message: t("actions.import_result.invalid_structure", { ns: "settings" }),
        }
      }

      // Validate each rule structure
      for (const rule of parsedData.rules) {
        if (!rule.name || typeof rule.name !== "string") {
          return {
            success: false,
            message: t("actions.import_result.invalid_name", { ns: "settings" }),
          }
        }
        if (!rule.condition || !Array.isArray(rule.condition)) {
          return {
            success: false,
            message: t("actions.import_result.invalid_condition", { ns: "settings" }),
          }
        }
        if (!rule.result || typeof rule.result !== "object") {
          return {
            success: false,
            message: t("actions.import_result.invalid_result", { ns: "settings" }),
          }
        }
      }

      // Import the rules
      const importedRules: ActionRules = parsedData.rules.map((rule: any, index: number) => ({
        name: rule.name,
        condition: rule.condition,
        result: rule.result,
        index,
      }))

      immerSet((state) => {
        state.rules = importedRules
        state.isDirty = true
      })

      return {
        success: true,
        message: t("actions.import_result.success", {
          ns: "settings",
          count: importedRules.length,
        }),
        importedCount: importedRules.length,
      }
    } catch (error) {
      return {
        success: false,
        message: t("actions.import_result.parse_failed", {
          ns: "settings",
          error:
            error instanceof Error
              ? error.message
              : t("actions.import_result.unknown_error", { ns: "settings" }),
        }),
      }
    }
  }
}

export const actionSyncService = new ActionSyncService()
export const actionActions = new ActionActions()

registerSyncModel("action", {
  bootstrap: async () => {
    await actionSyncService.fetchRules({ keepLocalEdits: true })
  },
  apply: async (action) => {
    const data = action.data as { rules?: ActionItemRes[] } | null
    if (action.action !== "U" || !data || !Array.isArray(data.rules)) return
    await actionActions.setConfirmedRules(normalizeRules(data.rules))
  },
})
