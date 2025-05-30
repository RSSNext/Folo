import { Button } from "@follow/components/ui/button/index.js"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiClient } from "~/lib/api-fetch"
import { Queries } from "~/queries"

export const ConfirmDeleteModalContent = ({ id, dismiss }: { dismiss: () => void; id: string }) => {
  const { t } = useTranslation("settings")
  const deleteMutation = useMutation({
    mutationFn: () => {
      return apiClient.rsshub.$delete({ json: { id } })
    },
    onSuccess: () => {
      Queries.rsshub.list().invalidate()
      toast.success(t("rsshub.table.delete.success"))
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <div className="w-[540px]">
      <div className="mb-4">
        <i className="i-mingcute-warning-fill -mb-1 mr-1 size-5 text-red-500" />
        {t("rsshub.table.delete.confirm")}
      </div>
      <div className="flex justify-end">
        <Button
          buttonClassName="bg-red-600"
          onClick={() => {
            deleteMutation.mutate()
            dismiss()
          }}
        >
          {t("rsshub.table.delete.label")}
        </Button>
      </div>
    </div>
  )
}
