import { Button } from "@follow/components/ui/button/index.js"
import { inboxSyncService } from "@follow/store/inbox/store"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { createErrorToaster } from "~/lib/error-parser"

export const ConfirmDestroyModalContent = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const { dismiss } = useCurrentModal()

  const mutationDestroy = useMutation({
    mutationFn: async (id: string) => {
      return inboxSyncService.deleteInbox(id)
    },
    onSuccess: () => {
      toast.success(t("discover.inbox_destroy_success"))
    },
    onMutate: () => {
      dismiss()
    },
    onError: createErrorToaster(t("discover.inbox_destroy_error")),
  })

  return (
    <div className="w-full max-w-[540px]">
      <div className="mb-4">
        <i className="i-mingcute-warning-fill -mb-1 mr-1 size-5 text-red-500" />
        {t("discover.inbox_destroy_warning")}
      </div>
      <div className="flex justify-end">
        <Button buttonClassName="bg-red-600" onClick={() => mutationDestroy.mutate(id)}>
          {t("words.confirm")}
        </Button>
      </div>
    </div>
  )
}
