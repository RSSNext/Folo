import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.js"
import { useCallback } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { AITaskList, AITaskModal } from "~/modules/ai-task"

export const TaskSchedulingSection = () => {
  const { present } = useModalStack()

  const handleCreateTask = useCallback(() => {
    present({
      title: "Schedule AI Task",
      content: () => <AITaskModal />,
    })
  }, [present])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-text text-sm font-medium">{"Schedule AI Tasks"}</Label>
          <div className="text-text-secondary text-xs">
            {"Create and manage automated AI tasks that run on your schedule."}
          </div>
        </div>
        <span className="text-text-tertiary flex items-center gap-1 text-sm">
          <Button onClick={handleCreateTask}>
            <i className="i-mgc-add-cute-re mr-2 size-4" />
            New Task
          </Button>
        </span>
      </div>

      <AITaskList />
    </div>
  )
}
