import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.js"
import { useCallback } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { AITaskList, AITaskModal, useCanCreateNewAITask } from "~/modules/ai-task"

export const TaskSchedulingSection = () => {
  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()

  const handleCreateTask = useCallback(() => {
    present({
      title: "New AI Task",
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
            {!canCreateNewTask && (
              <span className="text-red">
                {" (Limit reached: maximum number of tasks reached)"}
              </span>
            )}
          </div>
        </div>

        <Button
          disabled={!canCreateNewTask}
          size={"sm"}
          variant={"outline"}
          onClick={handleCreateTask}
        >
          <i className="i-mgc-add-cute-re mr-2 size-4" />
          New Task
        </Button>
      </div>

      <AITaskList />
    </div>
  )
}
