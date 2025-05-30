import type { ActionModel } from "@follow/models/types"

export interface ActionState {
  actions: ActionModel[]
  isDirty: boolean
}
