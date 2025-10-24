import { cn } from "@follow/utils/utils"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { useAITaskListQuery } from "../query"
import { TaskItem } from "./task-item"

interface TaskListProps {
  className?: string
}

export const AITaskList = memo<TaskListProps>(({ className }) => {
  const tasks = useAITaskListQuery()
  const { t } = useTranslation("ai")

  if (tasks === undefined) {
    return null
  }

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-fill-secondary">
          <i className="i-mgc-calendar-time-add-cute-re size-6 text-text" />
        </div>
        <h4 className="mb-1 text-sm font-medium text-text">{t("tasks.empty.title")}</h4>
        <p className="text-xs text-text-secondary">{t("tasks.empty.desc")}</p>
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
