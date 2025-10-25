import type { DragOverEvent, UniqueIdentifier } from "@dnd-kit/core"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@follow/components/ui/button/index.js"
import { getView } from "@follow/constants"
import type { CSSProperties, ReactNode } from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting } from "~/atoms/settings/ui"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { parseView } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"

function ContainerDroppable({ id, children }: { id: "visible" | "hidden"; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { container: id } })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] w-full flex-wrap items-center justify-center rounded-lg border border-border bg-material-ultra-thin p-2 pb-6 shadow-sm ${
        isOver ? "outline outline-1 outline-orange-400" : ""
      }`}
    >
      {children}
    </div>
  )
}

const areArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index])

function getViewMeta(timelineId: string) {
  const id = parseView(timelineId)
  if (typeof id !== "number") return { name: timelineId, icon: null }
  const item = getView(id)
  return { name: item?.name ?? String(id), icon: item?.icon ?? null }
}

function TabItem({ id }: { id: UniqueIdentifier }) {
  const meta = getViewMeta(String(id))
  const { t } = useTranslation()
  return (
    <div className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-material-opaque">
      <div className="flex size-6 items-center justify-center text-lg">{meta.icon}</div>
      <div className="text-callout text-text-secondary">
        {t(meta.name as any, { ns: "common" })}
      </div>
    </div>
  )
}

function SortableTabItem({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 999 : undefined,
    } as CSSProperties
  }, [transform, transition, isDragging])
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
      {...attributes}
      {...listeners}
    >
      <TabItem id={id} />
    </div>
  )
}

function useResolvedTimelineTabs() {
  const timelineList = useTimelineList({ visible: true })
  const timelineListHidden = useTimelineList({ hidden: true })

  return { visible: timelineList, hidden: timelineListHidden }
}

const TimelineTabsSettings = () => {
  const { visible, hidden } = useResolvedTimelineTabs()

  const commitTimelineTabs = useCallback(
    (nextVisible: string[], nextHidden: string[]) => {
      if (areArraysEqual(nextVisible, visible) && areArraysEqual(nextHidden, hidden)) return
      setUISetting("timelineTabs", { visible: nextVisible, hidden: nextHidden })
    },
    [hidden, visible],
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)

      const current = (key: "visible" | "hidden") => (key === "visible" ? visible : hidden)
      const isActiveInVisible = visible.includes(activeId)

      // Determine hovered list
      const overContainer = (over.data?.current as any)?.container as
        | "visible"
        | "hidden"
        | undefined
      const overKey: "visible" | "hidden" =
        overContainer || (visible.includes(overId) ? "visible" : "hidden")

      const isCross = (isActiveInVisible ? "visible" : "hidden") !== overKey

      if (isCross) {
        const sourceKey = isActiveInVisible ? "visible" : "hidden"
        const targetKey = overKey
        const sourceList = current(sourceKey)
        const targetList = current(targetKey)

        // Normal cross-container insert
        const newIndexOfOver = targetList.indexOf(overId)
        const insertIndex = newIndexOfOver !== -1 ? newIndexOfOver : targetList.length
        const nextSource = sourceList.filter((i) => i !== activeId)
        const nextTarget = [
          ...targetList.slice(0, insertIndex),
          activeId,
          ...targetList.slice(insertIndex),
        ]
        const nextVisible =
          sourceKey === "visible" ? nextSource : targetKey === "visible" ? nextTarget : visible
        const nextHidden =
          sourceKey === "hidden" ? nextSource : targetKey === "hidden" ? nextTarget : hidden
        commitTimelineTabs(nextVisible, nextHidden)
        return
      }

      // Reorder within list
      const listKey = isActiveInVisible ? "visible" : "hidden"
      const items = current(listKey)
      const oldIndex = items.indexOf(activeId)
      const newIndex = items.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
      const reordered = arrayMove(items, oldIndex, newIndex)
      const nextVisible = listKey === "visible" ? reordered : visible
      const nextHidden = listKey === "hidden" ? reordered : hidden
      commitTimelineTabs(nextVisible, nextHidden)
    },
    [commitTimelineTabs, hidden, visible],
  )

  return (
    <div
      className="mx-auto w-[600px] max-w-full space-y-4 overflow-hidden pt-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragOver}
      >
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-subheadline font-medium text-text">Visible</h3>
            <ContainerDroppable id="visible">
              <SortableContext items={visible} strategy={verticalListSortingStrategy}>
                {visible.map((id) => (
                  <SortableTabItem key={id} id={id} />
                ))}
              </SortableContext>
            </ContainerDroppable>
          </div>

          <div>
            <h3 className="mb-2 text-subheadline font-medium text-text">Hidden</h3>
            <ContainerDroppable id="hidden">
              <SortableContext items={hidden} strategy={verticalListSortingStrategy}>
                {hidden.map((id) => (
                  <SortableTabItem key={id} id={id} />
                ))}
              </SortableContext>
            </ContainerDroppable>
          </div>
        </div>
      </DndContext>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setUISetting("timelineTabs", {
              visible: [],
              hidden: [],
            })
          }}
        >
          Reset to default
        </Button>
      </div>
    </div>
  )
}

export const useShowTimelineTabsSettingsModal = () => {
  const { present } = useModalStack()
  return useCallback(() => {
    present({
      id: "timeline-tabs-settings",
      title: "Customize View Tabs",
      content: () => <TimelineTabsSettings />,
      overlay: true,
      clickOutsideToDismiss: true,
    })
  }, [present])
}
