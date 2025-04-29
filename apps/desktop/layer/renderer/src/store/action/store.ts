import type { ActionModel, ActionsResponse } from "@follow/models/types"

import { apiClient } from "~/lib/api-fetch"

import { createImmerSetter, createZustandStore } from "../utils/helper"
import type { ActionState } from "./types"

export const useActionStore = createZustandStore<ActionState>("action")(() => ({
  actions: [],
  isDirty: false,
}))

const set = createImmerSetter(useActionStore)
const get = useActionStore.getState

class ActionActionStatic {
  init(actions: ActionModel[]) {
    set((state) => {
      state.actions = actions
    })
  }

  insertNewEmptyAction(name: string) {
    set((state) => {
      state.actions.push({
        name,
        condition: [],
        result: {},
        index: state.actions.length,
      })
      state.isDirty = true
    })
  }

  removeByIndex(index: number) {
    set((state) => {
      state.actions.splice(index, 1)
      state.isDirty = true
    })
  }

  updateByIndex(index: number, update: (action: ActionModel) => void) {
    set((state) => {
      update(state.actions[index]!)
      state.isDirty = true
    })
  }

  async fillRemoteActions() {
    if (get().actions.length > 0) {
      return get().actions
    }

    const res = await apiClient.actions.$get()
    const rules = (res.data?.rules?.map((rule) => {
      const { condition } = rule
      // fix old data
      const finalCondition =
        condition.length === 0 || Array.isArray(condition[0]) ? condition : [condition]

      return {
        ...rule,
        condition: finalCondition as any,
      }
    }) || []) as ActionModel[]
    this.init(rules)
    return rules
  }

  async updateRemoteActions() {
    if (!get().isDirty) {
      return
    }

    set((state) => {
      state.actions.forEach((action) => {
        action.condition = action.condition
          .map((condition) => {
            return condition.filter((c) => c.field && c.operator && c.value)
          })
          .filter((c) => c.length > 0)
        action.result.rewriteRules = action.result.rewriteRules?.filter((r) => r.from && r.to)
        action.result.blockRules = action.result.blockRules?.filter(
          (r) => r.field && r.operator && r.value,
        )
        action.result.webhooks = action.result.webhooks?.filter((w) => w)
      })
    })

    await apiClient.actions.$put({
      json: {
        rules: get().actions as ActionsResponse,
      },
    })
    set((state) => {
      state.isDirty = false
    })
  }
}

export const actionActions = new ActionActionStatic()
