import type {
  ActionConditionIndex,
  ActionFilter,
  ActionFilterItem,
  ActionId,
  ActionModel,
  ActionRules,
} from "@follow/models/types"
import { merge } from "es-toolkit/compat"

import { apiClient } from "../context"
import { createImmerSetter, createZustandStore } from "../internal/helper"

type ActionStore = {
  rules: ActionRules
  isDirty: boolean
}

export const useActionStore = createZustandStore<ActionStore>("action")(() => ({
  rules: [],
  isDirty: false,
}))

const immerSet = createImmerSetter(useActionStore)

class ActionSyncService {
  async fetchRules() {
    const res = await apiClient().actions.$get()
    if (res.data) {
      actionActions.updateRules(
        (res.data.rules ?? []).map((rule, index) => {
          const { condition } = rule
          // fix old data
          const finalCondition =
            condition.length === 0 || Array.isArray(condition[0]) ? condition : [condition]

          return {
            ...rule,
            condition: finalCondition as ActionFilter,
            index,
          }
        }),
      )

      actionActions.setDirty(false)
    }
    return res
  }

  async saveRules() {
    const { rules, isDirty } = useActionStore.getState()
    if (!isDirty) {
      return null
    }

    const res = await apiClient().actions.$put({ json: { rules: rules as any } })
    actionActions.setDirty(false)
    return res
  }
}

class ActionActions {
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
        return { success: false, message: "Invalid JSON structure: missing or invalid rules array" }
      }

      // Validate each rule structure
      for (const rule of parsedData.rules) {
        if (!rule.name || typeof rule.name !== "string") {
          return { success: false, message: "Invalid rule: missing or invalid name field" }
        }
        if (!rule.condition || !Array.isArray(rule.condition)) {
          return { success: false, message: "Invalid rule: missing or invalid condition field" }
        }
        if (!rule.result || typeof rule.result !== "object") {
          return { success: false, message: "Invalid rule: missing or invalid result field" }
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
        message: `Successfully imported ${importedRules.length} action rule(s)`,
        importedCount: importedRules.length,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}

export const actionSyncService = new ActionSyncService()
export const actionActions = new ActionActions()
