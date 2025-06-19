import type { DragOverEvent } from "@dnd-kit/core"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@follow/components/ui/button/index.js"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting } from "~/atoms/settings/ui"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { DEFAULT_ACTION_ORDER } from "./constant"
import { DroppableContainer, SortableActionButton } from "./dnd"
import { useActionOrder } from "./hooks"

const CustomizeToolbar = () => {
  const { t } = useTranslation("settings")
  const actionOrder = useActionOrder()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return
      const activeId = active.id
      const overId = over.id
      const isActiveInMain = actionOrder.main.includes(activeId)
      const isOverInMain = overId === "container-main" || actionOrder.main.includes(overId)
      const isCrossContainer = isActiveInMain !== isOverInMain

      if (isCrossContainer) {
        // Moving between containers
        const sourceList = isActiveInMain ? "main" : "more"
        const targetList = isActiveInMain ? "more" : "main"
        const newIndexOfOver = actionOrder[targetList].indexOf(overId)
        setUISetting("toolbarOrder", {
          ...actionOrder,
          [sourceList]: actionOrder[sourceList].filter((item) => item !== activeId),
          [targetList]: [
            ...actionOrder[targetList].slice(0, newIndexOfOver),
            activeId,
            ...actionOrder[targetList].slice(newIndexOfOver),
          ],
        })
        return
      }
      // Reordering within container
      const list = isActiveInMain ? "main" : "more"
      const items = actionOrder[list]
      const oldIndex = items.indexOf(activeId)
      const newIndex = items.indexOf(overId)

      setUISetting("toolbarOrder", {
        ...actionOrder,
        [list]: arrayMove(items, oldIndex, newIndex),
      })
    },
    [actionOrder],
  )

  const resetActionOrder = useRef(() => {
    setUISetting("toolbarOrder", DEFAULT_ACTION_ORDER)
  }).current

  return (
    <div
      className="mx-auto w-full max-w-[800px] space-y-4"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-4">
        <h2 className="text-text text-title2 font-semibold">
          {t("customizeToolbar.quick_actions.title")}
        </h2>
        <p className="text-text-secondary text-headline">
          {t("customizeToolbar.quick_actions.description")}
        </p>
      </div>
      {/* Refer to https://github.com/clauderic/dnd-kit/blob/master/stories/2%20-%20Presets/Sortable/MultipleContainers.tsx */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver}>
        <div className="space-y-4">
          {/* Main toolbar */}

          <DroppableContainer>
            <SortableContext
              items={actionOrder.main.map((item) => item)}
              strategy={verticalListSortingStrategy}
            >
              {actionOrder.main.map((id) => (
                <SortableActionButton key={id} id={id} />
              ))}
            </SortableContext>
          </DroppableContainer>

          {/* More panel */}
          <div className="mb-4">
            <h2 className="text-text text-title2 font-semibold">
              {t("customizeToolbar.more_actions.title")}
            </h2>
            <p className="text-text-secondary text-headline">
              {t("customizeToolbar.more_actions.description")}
            </p>
          </div>

          <DroppableContainer>
            <SortableContext
              items={actionOrder.more.map((item) => item)}
              strategy={verticalListSortingStrategy}
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
