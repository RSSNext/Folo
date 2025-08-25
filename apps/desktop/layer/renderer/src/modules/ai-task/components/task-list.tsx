import { cn } from "@follow/utils/utils"
import { memo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useDialog } from "~/components/ui/modal/stacked/hooks"

import { useAITaskListQuery, useDeleteAITaskMutation, useUpdateAITaskMutation } from "../query"
import { TaskItem } from "./task-item"

interface TaskListProps {
  className?: string
}

export const AITaskList = memo<TaskListProps>(({ className }) => {
  const tasks = useAITaskListQuery()
  const deleteTaskMutation = useDeleteAITaskMutation()
  const updateTaskMutation = useUpdateAITaskMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { ask } = useDialog()
  const { t } = useTranslation()
  const handleDeleteTask = async (id: string, name: string) => {
    const confirmed = await ask({
      title: "Delete Task",
      message: `Are you sure you want to delete the task "${name}"?`,
      confirmText: t("words.delete", { ns: "common" }),
      cancelText: "Cancel",
      variant: "danger",
    })

    if (!confirmed) {
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

  if (tasks === undefined) {
    return null
  }

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="bg-fill-secondary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
          <i className="i-mgc-calendar-time-add-cute-re text-text size-6" />
        </div>
        <h4 className="text-text mb-1 text-sm font-medium">No scheduled tasks</h4>
        <p className="text-text-secondary text-xs">
          Create your first AI task to automate your workflows.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isDeleting={deletingId === task.id}
          onDelete={handleDeleteTask}
          onToggle={handleToggleTask}
        />
      ))}
    </div>
  )
})

AITaskList.displayName = "AITaskList"
