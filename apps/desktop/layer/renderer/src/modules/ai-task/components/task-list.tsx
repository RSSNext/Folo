import { cn } from "@follow/utils/utils"
import { memo } from "react"

import { useAITaskListQuery } from "../query"
import { TaskItem } from "./task-item"

interface TaskListProps {
  className?: string
}

export const AITaskList = memo<TaskListProps>(({ className }) => {
  const tasks = useAITaskListQuery()

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
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
})

AITaskList.displayName = "AITaskList"
