import { Button } from "@follow/components/ui/button/index.js"
import { useUpdateActionsMutation } from "@follow/store/action/hooks"
import { actionSyncService, isActionRulesConflictError } from "@follow/store/action/store"
import { useTranslation } from "react-i18next"
import { useEventCallback } from "usehooks-ts"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { toastFetchError } from "~/lib/error-parser"

const ActionRulesConflictContent = ({
  dismiss,
  onReload,
  onOverwrite,
}: {
  dismiss: () => void
  onReload: () => void
  onOverwrite: () => void
}) => {
  const { t } = useTranslation("settings")

  return (
    <div className="flex max-w-[48ch] flex-col gap-3">
      <p className="text-sm text-text-secondary">{t("actions.conflict.message")}</p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={dismiss}>
          {t("actions.conflict.keep_editing")}
        </Button>
        <Button
          variant="outline"
          textClassName="text-red"
          onClick={() => {
            dismiss()
            onOverwrite()
          }}
        >
          {t("actions.conflict.overwrite")}
        </Button>
        <Button
          onClick={() => {
            dismiss()
            onReload()
          }}
        >
          {t("actions.conflict.reload")}
        </Button>
      </div>
    </div>
  )
}

/**
 * Saves the action rules. When they were changed elsewhere since they were loaded the server
 * refuses the save, and the user chooses to load the latest rules, which drops their edits, to
 * keep editing, or to save over the other changes.
 */
export const useSaveActionRules = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()

  const presentConflict = useEventCallback((overwrite: () => void) => {
    present({
      title: t("actions.conflict.title"),
      content: ({ dismiss }) => (
        <ActionRulesConflictContent
          dismiss={dismiss}
          onOverwrite={overwrite}
          onReload={() => {
            actionSyncService.fetchRules().catch((error: Error) => toastFetchError(error))
          }}
        />
      ),
      canClose: true,
      clickOutsideToDismiss: false,
    })
  })

  const mutation = useUpdateActionsMutation({
    onSuccess,
    onError: (error) => {
      if (isActionRulesConflictError(error)) {
        presentConflict(() => mutation.mutate({ overwrite: true }))
        return
      }
      toastFetchError(error)
    },
  })

  return mutation
}
