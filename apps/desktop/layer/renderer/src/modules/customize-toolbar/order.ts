import type { UniqueIdentifier } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

import type { ToolbarActionOrder } from "./constant"

const TOOLBAR_CONTAINERS = ["main", "more"] as const satisfies (keyof ToolbarActionOrder)[]

const findContainer = (order: ToolbarActionOrder, id: UniqueIdentifier) =>
  TOOLBAR_CONTAINERS.find((container) => order[container].includes(id))

/**
 * Move the dragged action into the container of the action it is dragged over, at that action's
 * position. Returns `null` when both are already in the same container, so callers can skip the
 * no-op update.
 */
export const moveActionToContainer = (
  order: ToolbarActionOrder,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): ToolbarActionOrder | null => {
  const source = findContainer(order, activeId)
  const target = findContainer(order, overId)
  if (!source || !target || source === target) return null

  const targetItems = order[target]
  const insertIndex = targetItems.indexOf(overId)

  return {
    ...order,
    [source]: order[source].filter((id) => id !== activeId),
    [target]: [...targetItems.slice(0, insertIndex), activeId, ...targetItems.slice(insertIndex)],
  }
}

/**
 * Move the dragged action to the position of the action it is dropped on within the same
 * container. Returns `null` when the order doesn't change.
 */
export const reorderActionInContainer = (
  order: ToolbarActionOrder,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): ToolbarActionOrder | null => {
  const container = findContainer(order, activeId)
  if (!container) return null

  const items = order[container]
  const oldIndex = items.indexOf(activeId)
  const newIndex = items.indexOf(overId)
  if (newIndex === -1 || oldIndex === newIndex) return null

  return { ...order, [container]: arrayMove(items, oldIndex, newIndex) }
}
