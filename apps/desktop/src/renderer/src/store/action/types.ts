import type { ActionModel } from "@follow/models/types"

export interface ActionState {
  actions: ActionModel[]
  originalActions: ActionModel[]
  isDirty: boolean
}
