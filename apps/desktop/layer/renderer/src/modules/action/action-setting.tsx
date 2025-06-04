import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import {
  useActionRules,
  useIsActionDataDirty,
  usePrefetchActions,
  useUpdateActionsMutation,
} from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { useTranslation } from "react-i18next"
import { unstable_usePrompt } from "react-router"
import { toast } from "sonner"

import { queryClient } from "~/lib/query-client"
import { ActionCard } from "~/modules/action/action-card"

export const ActionSetting = () => {
  const actionQuery = usePrefetchActions()
  const actionLength = useActionRules((actions) => actions.length)

  if (actionQuery.isPending) {
    return <LoadingWithIcon icon={<i className="i-mgc-magic-2-cute-re" />} size="large" />
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      {Array.from({ length: actionLength }).map((_action, actionIdx) => (
        <ActionCard key={actionIdx} index={actionIdx} />
      ))}
      <ActionSettingOperations />
    </div>
  )
}

function ActionSettingOperations() {
  const { t } = useTranslation("settings")

  const actionLength = useActionRules((actions) => actions.length)
  const isDirty = useIsActionDataDirty()
  unstable_usePrompt({
    message: t("actions.navigate.prompt"),
    when: ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  })

  const mutation = useUpdateActionsMutation({
    onSuccess: () => {
      // apply new action settings
      queryClient.invalidateQueries({
        queryKey: ["entries"],
      })
      toast(t("actions.saveSuccess"))
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  return (
    <div className="flex justify-end gap-x-2">
      <Button
        variant={actionLength > 0 ? "outline" : "primary"}
        onClick={() => {
          actionActions.addRule((number) => t("actions.actionName", { number }))
        }}
      >
        <i className="i-mgc-add-cute-re mr-1" />
        <span>{t("actions.newRule")}</span>
      </Button>
      <Button
        variant="primary"
        disabled={!isDirty}
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <i className="i-mgc-check-circle-cute-re mr-1" />
        {t("actions.save")}
      </Button>
    </div>
  )
}
