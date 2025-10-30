import { Button } from "@follow/components/ui/button/index.js"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { AITaskList, AITaskModal, useCanCreateNewAITask } from "~/modules/ai-task"

export const TaskSchedulingSection = () => {
  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()
  const { t } = useTranslation("ai")

  const handleCreateTask = useCallback(() => {
    present({
      title: t("tasks.modal.new_title"),
      content: () => <AITaskModal />,
    })
  }, [present, t])

  return (
    <div className="-mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs text-text-secondary">
            {t("tasks.manage.desc")}
            {!canCreateNewTask && (
              <span className="text-red"> {t("tasks.manage.limit_reached")}</span>
            )}
          </div>
        </div>

        <Button
          disabled={!canCreateNewTask}
          size={"sm"}
          variant={"outline"}
          onClick={handleCreateTask}
          buttonClassName="!-translate-y-7"
        >
          <i className="i-mgc-add-cute-re mr-2 size-4" />
          {t("tasks.actions.new_task")}
        </Button>
      </div>

      <AITaskList />
    </div>
  )
}
