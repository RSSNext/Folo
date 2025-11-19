import { Button } from "@follow/components/ui/button/index.js"
import type { FeedViewType } from "@follow/constants"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { createErrorToaster } from "~/lib/error-parser"

import { useCurrentModal } from "../../components/ui/modal/stacked/hooks"

export function CategoryUnsubscribeDialogContent({
  category,
  view,
}: {
  category: string
  view: FeedViewType
}) {
  const { t } = useTranslation()
  const feedIds = useMemo(() => getCategoryFeedIds(category, view), [category, view])
  const count = feedIds.length

  const unsubscribeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return
      await subscriptionSyncService.unsubscribe(ids)
    },
    onError: createErrorToaster(t("sidebar.category_unsubscribe_dialog.error")),
    onSuccess: () => {
      toast.success(t("sidebar.category_unsubscribe_dialog.success", { count, category }))
    },
  })

  const { dismiss } = useCurrentModal()

  return (
    <div className="flex w-[45ch] max-w-full flex-col gap-4">
      <p className="text-text">
        {t("sidebar.category_unsubscribe_dialog.description", {
          category,
          count,
        })}
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={dismiss}>
          {t("sidebar.category_unsubscribe_dialog.cancel")}
        </Button>
        <Button
          isLoading={unsubscribeMutation.isPending}
          disabled={count === 0}
          onClick={() =>
            unsubscribeMutation.mutateAsync(feedIds).then(() => {
              dismiss()
            })
          }
        >
          {t("sidebar.category_unsubscribe_dialog.confirm", { count })}
        </Button>
      </div>
    </div>
  )
}
