import { cn } from "@follow/utils/utils"
import type { AITask, TaskSchedule } from "@follow-app/client-sdk"
import dayjs from "dayjs"
import { memo, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAIPanelVisibility } from "~/atoms/settings/ai"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { ChatSliceActions } from "~/modules/ai-chat/store/chat-core/chat-actions"
import { AIChatSessionService } from "~/modules/ai-chat-session"
import { useAIChatSessionListQuery } from "~/modules/ai-chat-session/query"
import type { ActionButton } from "~/modules/ai-task/components/ai-item-actions"
import { ItemActions } from "~/modules/ai-task/components/ai-item-actions"

import { useDeleteAITaskMutation, useUpdateAITaskMutation } from "../query"
import { AITaskModal } from "./ai-task-modal"

const formatScheduleText = (schedule: TaskSchedule) => {
  if (!schedule) return "Unknown schedule"

  switch (schedule.type) {
    case "once": {
      const date = dayjs(schedule.date)
      return `Once on ${date.format("MMM D, YYYY")} at ${date.format("h:mm A")}`
    }
    case "daily": {
      const time = dayjs(schedule.timeOfDay)
      return `Daily at ${time.format("h:mm A")}`
    }
    case "weekly": {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const time = dayjs(schedule.timeOfDay)
      return `Weekly on ${days[schedule.dayOfWeek]} at ${time.format("h:mm A")}`
    }
    case "monthly": {
      const time = dayjs(schedule.timeOfDay)
      return `Monthly on day ${schedule.dayOfMonth} at ${time.format("h:mm A")}`
    }
    default: {
      return "Unknown schedule"
    }
  }
}

const getTaskStatus = (task: AITask) => {
  if (!task.schedule) return "unknown"

  // If task is disabled, it's paused
  if (!task.isEnabled) return "paused"

  const now = dayjs()

  if (task.schedule.type === "once") {
    const scheduledDate = dayjs(task.schedule.date)
    return scheduledDate.isBefore(now) ? "completed" : "scheduled"
  }

  return "scheduled"
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": {
      return "text-green bg-green-50 dark:bg-green-950"
    }
    case "scheduled": {
      return "text-blue bg-blue-50 dark:bg-blue-950"
    }
    case "paused": {
      return "text-gray bg-gray-50 dark:bg-gray-950"
    }
    default: {
      return "text-gray bg-gray-50 dark:bg-gray-950"
    }
  }
}

export const TaskItem = memo(({ task }: { task: AITask }) => {
  const { present } = useModalStack()
  const deleteTaskMutation = useDeleteAITaskMutation()
  const updateTaskMutation = useUpdateAITaskMutation()
  const { ask } = useDialog()
  const { t } = useTranslation()
  const sessions = useAIChatSessionListQuery()
  // const chatActions = useChatActions()
  const [openingReport, setOpeningReport] = useState(false)
  const status = getTaskStatus(task)
  const statusColorClass = getStatusColor(status)

  const taskSession = useMemo(
    () => sessions?.find((s) => s.chatId === task.id),
    [sessions, task.id],
  )

  const handleEditTask = (task: AITask) => {
    present({
      title: "Edit AI Task",
      content: () => <AITaskModal task={task} />,
    })
  }

  const isDeleting = deleteTaskMutation.isPending

  const handleOpenReport = useCallback(async () => {
    if (!taskSession) {
      toast.error("No report session found for this task yet.")
      return
    }
    setOpeningReport(true)
    try {
      await AIChatSessionService.fetchAndPersistMessages(taskSession)
    } catch (e) {
      console.error("Failed to sync chat session messages:", e)
      toast.error("Failed to load chat messages")
    }
    setAIPanelVisibility(true)
    const chatActions = ChatSliceActions.getActiveInstance()
    if (!chatActions) {
      console.error("No active chat session found.")
    }
    chatActions?.switchToChat(taskSession.chatId)
    setOpeningReport(false)
    toast("Switch to the chat panel to view reports.")
  }, [taskSession])

  const actions: ActionButton[] = [
    // Only show if the task has at least one run
    ...(taskSession
      ? [
          {
            icon: "i-mgc-history-cute-re" as const,
            onClick: handleOpenReport,
            title: "View reports",
            loading: openingReport,
            disabled: openingReport,
          } satisfies ActionButton,
        ]
      : []),
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => handleEditTask(task),
      title: "Edit task",
    },
    {
      icon: "i-mgc-delete-2-cute-re",
      onClick: async () => {
        const confirmed = await ask({
          title: "Delete Task",
          // translation fallback pattern; primary key then default string
          message: `Are you sure you want to delete the task "${task.name}"?`,
          confirmText: t("words.delete", { ns: "common" }),
          cancelText: t("words.cancel", { ns: "common" }),
          variant: "danger",
        })
        if (!confirmed) return
        try {
          await deleteTaskMutation.mutateAsync({ id: task.id })
          toast.success("Task deleted successfully")
        } catch (error) {
          console.error("Failed to delete task:", error)
          toast.error("Failed to delete task. Please try again.")
        }
      },
      title: "Delete task",
      disabled: isDeleting,
      loading: isDeleting,
    },
  ]

  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{task.name}</h4>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs",
                statusColorClass,
              )}
            >
              {status === "completed" && <i className="i-mgc-check-cute-re mr-1 size-3" />}
              {status === "scheduled" && (
                <i className="i-mgc-calendar-time-add-cute-re mr-1 size-3" />
              )}
              {status === "paused" && <i className="i-mgc-pause-cute-re mr-1 size-3" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-text-secondary text-xs">
              <span className="text-text-tertiary">Schedule:</span>{" "}
              {formatScheduleText(task.schedule)}
            </p>
            <p className="text-text-secondary text-xs">
              <span className="text-text-tertiary">Prompt:</span> {task.prompt}
            </p>
            {task.createdAt && (
              <p className="text-text-secondary text-xs">
                <span className="text-text-tertiary">Created:</span>{" "}
                {dayjs(task.createdAt).format("MMM D, YYYY h:mm A")}
              </p>
            )}
          </div>
        </div>

        <ItemActions
          actions={actions}
          enabled={task.isEnabled}
          onToggle={async () => {
            try {
              await updateTaskMutation.mutateAsync({ id: task.id, isEnabled: !task.isEnabled })
            } catch (error) {
              console.error("Failed to toggle task:", error)
              toast.error("Failed to update task. Please try again.")
            }
          }}
        />
      </div>
    </div>
  )
})

TaskItem.displayName = "TaskItem"
