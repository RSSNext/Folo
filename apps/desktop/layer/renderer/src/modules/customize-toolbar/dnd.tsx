import type { UniqueIdentifier } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { IN_ELECTRON } from "@follow/shared"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { COMMAND_ID } from "../command/commands/id"
import { getCommand } from "../command/hooks/use-command"
import type { FollowCommandId } from "../command/types"

const SortableItem = ({ id, children }: { id: UniqueIdentifier; children: ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges: () => true, // Enable layout animations
    transition: {
      duration: 400,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  })

  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      width: "100px", // Fixed width
      height: "80px", // Fixed height
      zIndex: isDragging ? 999 : undefined,
    }
  }, [transform, transition, isDragging])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={` ${isDragging ? "cursor-grabbing opacity-90" : "cursor-grab"} transition-colors duration-200`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

const warningActionButton: Partial<
  Record<
    FollowCommandId,
    {
      show: boolean
      info: string
    }
  >
> = {
  [COMMAND_ID.entry.tts]: {
    show: !IN_ELECTRON,
    info: "entry_actions.warn_info_for_desktop",
  },
  [COMMAND_ID.global.toggleAIChatPinned]: {
    show: true,
    info: "entry_actions.warn_info_ai_chat_pinned_tip",
  },
}

export const SortableActionButton = ({ id }: { id: UniqueIdentifier }) => {
  const cmd = getCommand(id as FollowCommandId)
  const warnInfo = warningActionButton[id as FollowCommandId]
  const { t } = useTranslation()
  if (!cmd) return null
  return (
    <SortableItem id={id}>
      <div className="hover:bg-material-opaque flex flex-col items-center rounded-lg p-2">
        <div className="flex size-8 items-center justify-center text-xl">
          {typeof cmd.icon === "function" ? cmd.icon({ isActive: false }) : cmd.icon}
        </div>
        <div className="text-text-secondary text-callout mt-1 text-center">
          {warnInfo?.show && (
            <Tooltip>
              <TooltipTrigger>
                <i className="i-mgc-information-cute-re mr-1 translate-y-[2px]" />
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>{t(warnInfo.info as any)}</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
          {cmd.label.title}
        </div>
      </div>
    </SortableItem>
  )
}

export function DroppableContainer({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-material-ultra-thin flex min-h-[120px] w-full flex-wrap items-center justify-center rounded-lg border p-2 pb-6 shadow-sm">
      {children}
    </div>
  )
}
