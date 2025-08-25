import { Button } from "@follow/components/ui/button/index.js"
import { Switch } from "@follow/components/ui/switch/index.js"
import { cn } from "@follow/utils/utils"
import type { AITask, TaskSchedule } from "@follow-app/client-sdk"
import dayjs from "dayjs"
import { memo } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { AITaskModal } from "./ai-task-modal"

interface TaskItemProps {
  task: AITask
  isDeleting: boolean
  onDelete: (id: string, name: string) => void
  onToggle: (id: string, name: string, currentEnabled: boolean) => void
}

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
    return scheduledDate.isBefore(now) ? "completed" : "pending"
  }

  // For recurring tasks, they're always "active"
  return "active"
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": {
      return "text-green-600 bg-green-50 border-green-200"
    }
    case "active": {
      return "text-blue-600 bg-blue-50 border-blue-200"
    }
    case "pending": {
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    }
    case "paused": {
      return "text-gray-600 bg-gray-50 border-gray-200"
    }
    default: {
      return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }
}

export const TaskItem = memo<TaskItemProps>(({ task, isDeleting, onDelete, onToggle }) => {
  const { present } = useModalStack()
  const status = getTaskStatus(task)
  const statusColorClass = getStatusColor(status)

  const handleEditTask = (task: AITask) => {
    present({
      title: "Edit AI Task",
      content: () => <AITaskModal task={task} />,
      clickOutsideToDismiss: true,
    })
  }

  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{task.name}</h4>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                statusColorClass,
              )}
            >
              {status === "completed" && <i className="i-mgc-check-cute-re mr-1 size-3" />}
              {status === "active" && <i className="i-mgc-time-cute-re mr-1 size-3" />}
              {status === "pending" && <i className="i-mgc-time-cute-re mr-1 size-3" />}
              {status === "paused" && <i className="i-mgc-pause-cute-re mr-1 size-3" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <div className="border-fill-tertiary flex items-center gap-2 border-l pl-3">
              <span className="text-text-tertiary text-xs font-medium">
                {task.isEnabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={task.isEnabled}
                onCheckedChange={() => onToggle(task.id, task.name, task.isEnabled)}
              />
            </div>
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

        <div className="ml-4 flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)} title="Edit task">
            <i className="i-mgc-edit-cute-re size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(task.id, task.name)}
            title="Delete task"
          >
            {isDeleting ? (
              <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
            ) : (
              <i className="i-mgc-delete-2-cute-re size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
})

TaskItem.displayName = "TaskItem"
