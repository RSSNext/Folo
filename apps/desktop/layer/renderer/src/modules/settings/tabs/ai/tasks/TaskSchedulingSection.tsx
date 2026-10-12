import { Button } from "@follow/components/ui/button/index.js"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useIsPaymentEnabled } from "~/atoms/server-configs"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import {
  AITaskList,
  AITaskModal,
  useAITaskPlanLimit,
  useCanCreateNewAITask,
} from "~/modules/ai-task"
import { useSetSettingTab } from "~/modules/settings/modal/context"

export const TaskSchedulingSection = () => {
  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()
  const isNotInPlan = useAITaskPlanLimit() === 0
  const isPaymentEnabled = useIsPaymentEnabled()
  const setTab = useSetSettingTab()
  const { t } = useTranslation("ai")

  const handleCreateTask = useCallback(() => {
    present({
      title: t("tasks.modal.new_title"),
      content: () => <AITaskModal />,
    })
  }, [present, t])

  return (
    <div className="-mt-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-text-secondary">
            {t("tasks.manage.desc")}
            {isNotInPlan ? (
              <>
                <span className="text-red"> {t("tasks.manage.not_in_plan")}</span>
                {isPaymentEnabled && (
                  <button
                    type="button"
                    className="ml-1 text-accent hover:underline"
                    onClick={() => setTab("plan")}
                  >
                    {t("subscription.actions.upgrade", { ns: "settings" })}
                  </button>
                )}
              </>
            ) : (
              !canCreateNewTask && (
                <span className="text-red"> {t("tasks.manage.limit_reached")}</span>
              )
            )}
          </div>
        </div>

        <Button
          disabled={!canCreateNewTask}
          size={"sm"}
          variant={"outline"}
          onClick={handleCreateTask}
          buttonClassName="!-translate-y-7 shrink-0"
        >
          <i className="i-mgc-add-cute-re mr-2 size-4" />
          {t("tasks.actions.new_task")}
        </Button>
      </div>

      <AITaskList />
    </div>
  )
}
