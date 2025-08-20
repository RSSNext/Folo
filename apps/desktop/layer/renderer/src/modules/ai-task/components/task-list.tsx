import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.js"
import { Switch } from "@follow/components/ui/switch/index.js"
import { cn } from "@follow/utils/utils"
import type { AITask, TaskSchedule } from "@follow-app/client-sdk"
import dayjs from "dayjs"
import { memo, useState } from "react"
import { toast } from "sonner"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { useAITaskListQuery, useDeleteAITaskMutation, useUpdateAITaskMutation } from "../query"
import { AITaskModal } from "./ai-task-modal"

interface TaskListProps {
  className?: string
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

export const AITaskList = memo<TaskListProps>(({ className }) => {
  const tasks = useAITaskListQuery()
  const deleteTaskMutation = useDeleteAITaskMutation()
  const updateTaskMutation = useUpdateAITaskMutation()
  const { present } = useModalStack()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteTask = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the task "${name}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      await deleteTaskMutation.mutateAsync({ id })
      toast.success("Task deleted successfully")
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast.error("Failed to delete task. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleTask = async (id: string, name: string, currentEnabled: boolean) => {
    try {
      await updateTaskMutation.mutateAsync({
        id,
        isEnabled: !currentEnabled,
      })
    } catch (error) {
      console.error("Failed to toggle task:", error)
      toast.error("Failed to update task. Please try again.")
    }
  }

  const handleEditTask = (task: AITask) => {
    present({
      title: "Edit AI Task",
      content: () => <AITaskModal task={task} />,
      clickOutsideToDismiss: true,
    })
  }

  if (tasks === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((skeletonId) => (
          <Card key={skeletonId}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <i className="i-mgc-calendar-time-add-cute-re text-text-secondary mb-4 size-12" />
          <h3 className="text-text mb-2 text-lg font-medium">No scheduled tasks</h3>
          <p className="text-text-secondary text-center text-sm">
            Create your first AI task to automate your workflows.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        {tasks.map((task) => {
          const status = getTaskStatus(task)
          const statusColorClass = getStatusColor(status)

          return (
            <Card key={task.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">{task.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                          statusColorClass,
                        )}
                      >
                        {status === "completed" && (
                          <i className="i-mgc-check-cute-re mr-1 size-3" />
                        )}
                        {status === "active" && <i className="i-mgc-time-cute-re mr-1 size-3" />}
                        {status === "pending" && <i className="i-mgc-time-cute-re mr-1 size-3" />}
                        {status === "paused" && <i className="i-mgc-pause-cute-re mr-1 size-3" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {formatScheduleText(task.schedule)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                      title="Edit task"
                    >
                      <i className="i-mgc-edit-cute-re size-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === task.id}
                      onClick={() => handleDeleteTask(task.id, task.name)}
                      title="Delete task"
                    >
                      {deletingId === task.id ? (
                        <LoadingCircle size="small" />
                      ) : (
                        <i className="i-mgc-delete-2-cute-re size-4" />
                      )}
                    </Button>
                    <div className="border-fill-tertiary flex items-center gap-2 border-l pl-3">
                      <span className="text-text-tertiary text-xs font-medium">
                        {task.isEnabled ? "ON" : "OFF"}
                      </span>
                      <Switch
                        checked={task.isEnabled}
                        onCheckedChange={() => handleToggleTask(task.id, task.name, task.isEnabled)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <p className="text-text-secondary rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    {task.prompt}
                  </p>
                </div>

                {task.createdAt && (
                  <div className="border-border mt-3 border-t pt-3">
                    <span className="text-text-secondary text-xs">
                      Created {dayjs(task.createdAt).format("MMM D, YYYY h:mm A")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
})

AITaskList.displayName = "AITaskList"
