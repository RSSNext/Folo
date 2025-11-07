import { cn, sleep } from "@follow/utils/utils"
import type { AITask, TaskSchedule } from "@follow-app/client-sdk"
import dayjs from "dayjs"
import type { i18n, TFunction } from "i18next"
import { memo, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAIPanelVisibility } from "~/atoms/settings/ai"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { toastFetchError } from "~/lib/error-parser"
import { AIPersistService } from "~/modules/ai-chat/services"
import { ChatSliceActions } from "~/modules/ai-chat/store/chat-core/chat-actions"
import { AIChatSessionService } from "~/modules/ai-chat-session"
import { useAIChatSessionListQuery } from "~/modules/ai-chat-session/query"
import type { ActionButton } from "~/modules/ai-task/components/ai-item-actions"
import { ItemActions } from "~/modules/ai-task/components/ai-item-actions"

import {
  useDeleteAITaskMutation,
  useTestRunAITaskMutation,
  useUpdateAITaskMutation,
} from "../query"
import { AITaskModal } from "./ai-task-modal"

/**
 * Returns a localized weekday name for the given dayOfWeek index (0=Sunday ... 6=Saturday).
 *
 * @see https://stackoverflow.com/questions/30437134/how-to-get-the-weekday-names-using-intl
 *
 * @example
 * ```ts
 * getLocalizedWeekday(0, 'zh') // '星期日'
 * getLocalizedWeekday(1, 'ja-jp') // '月曜日'
 * ```
 */
const getLocalizedWeekday = (
  dayOfWeek: number,
  locale: string | undefined,
  options: { format?: "long" | "short" | "narrow" } = {},
): string => {
  const fmt = options.format || "long"
  const d = new Date()
  d.setHours(15, 0, 0, 0) /* normalise */
  d.setDate(d.getDate() - d.getDay()) /* Sunday */
  const loc = locale || "en-US"
  const date = d.setDate(d.getDate() + dayOfWeek)
  return new Intl.DateTimeFormat(loc, { weekday: fmt }).format(date)
}

const formatScheduleText = (schedule: TaskSchedule, t: TFunction<"ai", undefined>, i18n: i18n) => {
  if (!schedule) return t("tasks.schedule.unknown")
  switch (schedule.type) {
    case "once": {
      const date = dayjs(schedule.date)
      return t("tasks.schedule.once", {
        date: date.format("MMM D, YYYY"),
        time: date.format("h:mm A"),
      })
    }
    case "daily": {
      const time = dayjs(schedule.timeOfDay)
      return t("tasks.schedule.daily", { time: time.format("h:mm A") })
    }
    case "weekly": {
      const time = dayjs(schedule.timeOfDay)
      const dayName = getLocalizedWeekday(schedule.dayOfWeek, i18n.language)
      return t("tasks.schedule.weekly", { day: dayName, time: time.format("h:mm A") })
    }
    case "monthly": {
      const time = dayjs(schedule.timeOfDay)
      return t("tasks.schedule.monthly", { day: schedule.dayOfMonth, time: time.format("h:mm A") })
    }
    default: {
      return t("tasks.schedule.unknown")
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
  const testRunMutation = useTestRunAITaskMutation()
  const { ask } = useDialog()
  const { t, i18n } = useTranslation("ai")
  const sessions = useAIChatSessionListQuery()
  // const chatActions = useChatActions()
  const [openingReport, setOpeningReport] = useState(false)
  const status = getTaskStatus(task)
  const statusColorClass = getStatusColor(status)

  const taskSession = useMemo(
    () => sessions?.find((s) => s.chatId.startsWith(`ai-task-${task.id}`)),
    [sessions, task.id],
  )

  const handleEditTask = (task: AITask) => {
    present({
      title: t("tasks.modal.edit_title"),
      content: () => <AITaskModal task={task} />,
    })
  }

  const isDeleting = deleteTaskMutation.isPending

  const handleOpenReport = useCallback(async () => {
    if (!taskSession) {
      toast.error(t("tasks.toast.no_report"))
      return
    }
    setOpeningReport(true)
    try {
      await AIChatSessionService.fetchAndPersistMessages(taskSession)
    } catch (e) {
      console.error("Failed to sync chat session messages:", e)
      toast.error(t("tasks.toast.load_failed"))
    }
    setAIPanelVisibility(true)
    const chatActions = ChatSliceActions.getActiveInstance()
    if (!chatActions) {
      console.error("No active chat session found.")
    }
    chatActions?.switchToChat(taskSession.chatId)
    setOpeningReport(false)
    toast(t("tasks.toast.switch_to_chat"))
  }, [taskSession, t])

  const actions: ActionButton[] = [
    // Only show if the task has at least one run
    ...(taskSession
      ? [
          {
            icon: "i-mgc-history-cute-re",
            onClick: handleOpenReport,
            title: t("tasks.actions.view_reports"),
            loading: openingReport,
            disabled: openingReport,
          } satisfies ActionButton,
        ]
      : []),
    {
      icon: "i-mgc-test-tube-cute-re",
      onClick: async () => {
        const loadingId = toast.loading(t("tasks.toast.test_start"))
        try {
          const testRunResult = await testRunMutation.mutateAsync({ id: task.id })
          if (testRunResult.data.error) {
            throw new Error(testRunResult.data.error)
          }
          const { sessionId } = testRunResult.data
          if (!sessionId) {
            throw new Error("No session ID returned from test run")
          }

          // Ensure the session exists in local DB
          await AIPersistService.ensureSession(sessionId, {
            title: task.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          // Switch to the chat
          setAIPanelVisibility(true)
          const chatActions = ChatSliceActions.getActiveInstance()
          if (chatActions) {
            await sleep(1500) // wait for backend stream to be ready
            chatActions.switchToChat(sessionId)
          }

          toast.success(t("tasks.toast.test_success"), {
            id: loadingId,
          })
        } catch (error) {
          console.error("Failed to run test:", error)
          toast.dismiss(loadingId)
          if (error instanceof Error) {
            toastFetchError(error)
            return
          }
          toast.error(t("tasks.toast.test_failed"))
        }
      },
      title: t("tasks.actions.test_run"),
      disabled: testRunMutation.isPending,
      loading: testRunMutation.isPending,
    },
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => handleEditTask(task),
      title: t("tasks.actions.edit_task"),
    },
    {
      icon: "i-mgc-delete-2-cute-re",
      onClick: async () => {
        const confirmed = await ask({
          title: t("tasks.modal.delete_title"),
          // translation fallback pattern; primary key then default string
          message: t("tasks.modal.delete_confirm", { name: task.name }),
          confirmText: t("words.delete", { ns: "common" }),
          cancelText: t("words.cancel", { ns: "common" }),
          variant: "danger",
        })
        if (!confirmed) return
        try {
          await deleteTaskMutation.mutateAsync({ id: task.id })
          toast.success(t("tasks.toast.delete_success"))
        } catch (error) {
          console.error("Failed to delete task:", error)
          toast.error(t("tasks.toast.delete_failed"))
        }
      },
      title: t("tasks.actions.delete_task"),
      disabled: isDeleting,
      loading: isDeleting,
    },
  ]

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text">{task.name}</h4>
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
              <span>{t(`tasks.status.${status}`)}</span>
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-secondary">
              <span className="text-text-tertiary">{t("tasks.fields.schedule")}</span>{" "}
              {formatScheduleText(task.schedule, t, i18n)}
            </p>
            {task.createdAt && (
              <p className="text-xs text-text-secondary">
                <span className="text-text-tertiary">{t("tasks.fields.created")}</span>{" "}
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
              toast.error(t("tasks.toast.update_failed"))
            }
          }}
        />
      </div>
    </div>
  )
})

TaskItem.displayName = "TaskItem"
