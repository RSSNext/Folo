import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Button } from "@follow/components/ui/button/index.js"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting } from "~/atoms/settings/ui"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { DEFAULT_ACTION_ORDER } from "./constant"
import { DroppableContainer, SortableActionButton } from "./dnd"
import { useActionOrder } from "./hooks"
import { moveActionToContainer, reorderActionInContainer } from "./order"

const CustomizeToolbar = () => {
  const { t } = useTranslation("settings")
  const actionOrder = useActionOrder()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Only moves between the two containers happen while dragging, so the action shows up in the
  // container it is dragged into. Reordering within a container is previewed by the sortable
  // strategy and saved on drop: saving it on every dragover re-renders the lists, which fires
  // dragover again and can loop until React throws "Maximum update depth exceeded" (#4494).
  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return
      const nextOrder = moveActionToContainer(actionOrder, active.id, over.id)
      if (nextOrder) setUISetting("toolbarOrder", nextOrder)
    },
    [actionOrder],
  )

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over) return
      const nextOrder =
        moveActionToContainer(actionOrder, active.id, over.id) ??
        reorderActionInContainer(actionOrder, active.id, over.id)
      if (nextOrder) setUISetting("toolbarOrder", nextOrder)
    },
    [actionOrder],
  )

  const resetActionOrder = useRef(() => {
    setUISetting("toolbarOrder", DEFAULT_ACTION_ORDER)
  }).current

  return (
    <div
      className="mx-auto w-full max-w-[800px] space-y-4 overflow-hidden"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-4">
        <h2 className="text-title2 font-semibold text-text">
          {t("customizeToolbar.quick_actions.title")}
        </h2>
        <p className="text-headline text-text-secondary">
          {t("customizeToolbar.quick_actions.description")}
        </p>
      </div>
      {/* Refer to https://github.com/clauderic/dnd-kit/blob/master/stories/2%20-%20Presets/Sortable/MultipleContainers.tsx */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Main toolbar */}

          {/* The actions wrap into a grid, so use the rect strategy to preview the new position */}
          <DroppableContainer>
            <SortableContext
              items={actionOrder.main.map((item) => item)}
              strategy={rectSortingStrategy}
            >
              {actionOrder.main.map((id) => (
                <SortableActionButton key={id} id={id} />
              ))}
            </SortableContext>
          </DroppableContainer>

          {/* More panel */}
          <div className="mb-4">
            <h2 className="text-title2 font-semibold text-text">
              {t("customizeToolbar.more_actions.title")}
            </h2>
            <p className="text-headline text-text-secondary">
              {t("customizeToolbar.more_actions.description")}
            </p>
          </div>

          <DroppableContainer>
            <SortableContext
              items={actionOrder.more.map((item) => item)}
              strategy={rectSortingStrategy}
            >
              {actionOrder.more.map((id) => (
                <SortableActionButton key={id} id={id} />
              ))}
            </SortableContext>
          </DroppableContainer>
        </div>
      </DndContext>

      <div className="flex justify-end">
        <Button variant="outline" onClick={resetActionOrder}>
          {t("customizeToolbar.reset_layout")}
        </Button>
      </div>
    </div>
  )
}

export const useShowCustomizeToolbarModal = () => {
  const [t] = useTranslation("settings")
  const { present } = useModalStack()

  return useCallback(() => {
    present({
      id: "customize-toolbar",
      title: t("customizeToolbar.title"),
      content: () => <CustomizeToolbar />,
      overlay: true,
      clickOutsideToDismiss: true,
    })
  }, [present, t])
}
