import { Button } from "@follow/components/ui/button/index.js"
import { useMutation } from "@tanstack/react-query"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { createErrorToaster } from "~/lib/error-parser"
import { subscriptionActions } from "~/store/subscription"

import { useCurrentModal } from "../../components/ui/modal/stacked/hooks"

export function CategoryRemoveDialogContent({ feedIdList }: { feedIdList: string[] }) {
  const { t } = useTranslation()
  const deleteMutation = useMutation({
    mutationFn: () => subscriptionActions.deleteCategory(feedIdList),
    onError: createErrorToaster(t("sidebar.category_remove_dialog.error")),
    onSuccess: () => {
      toast.success(t("sidebar.category_remove_dialog.success"))
    },
  })

  const { dismiss } = useCurrentModal()

  return (
    <div className="flex w-[65ch] max-w-full flex-col gap-4">
      <Trans i18nKey="sidebar.category_remove_dialog.description">
        <p>
          This operation will delete your category, but the feeds it contains will be retained and
          grouped by website.
        </p>
      </Trans>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={dismiss}>
          {t("sidebar.category_remove_dialog.cancel")}
        </Button>
        <Button
          isLoading={deleteMutation.isPending}
          onClick={() => deleteMutation.mutateAsync().then(() => dismiss())}
        >
          {t("sidebar.category_remove_dialog.continue")}
        </Button>
      </div>
    </div>
  )
}
