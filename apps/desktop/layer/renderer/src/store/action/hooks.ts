import type { ActionModel } from "@follow/models/types"

import { useActionStore } from "./store"

export function useActions(): ActionModel[]
export function useActions<T>(selector: (actions: ActionModel[]) => T): T
export function useActions<T>(selector?: (actions: ActionModel[]) => T) {
  return useActionStore((state) => (selector ? selector(state.actions) : state.actions))
}

export function useActionByIndex(index: number): ActionModel
export function useActionByIndex<T>(index: number, selector: (action: ActionModel) => T): T
export function useActionByIndex<T>(index: number, selector?: (action: ActionModel) => T) {
  return useActionStore((state) =>
    selector ? selector(state.actions[index]!) : state.actions[index],
  )
}

export function useIsActionDataDirty() {
  return useActionStore((state) => state.isDirty)
}
