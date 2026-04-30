import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent } from "@follow/components/ui/card/index.js"
import type { RSSHubListItem } from "@follow-app/client-sdk"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { UserAvatar } from "~/modules/user/UserAvatar"
import { useSetRSSHubMutation } from "~/queries/rsshub"

import { useTOTPModalWrapper } from "../profile/hooks"

export function SetModalContent({
  dismiss,
  instance,
}: {
  dismiss: () => void
  instance: RSSHubListItem
}) {
  const { t } = useTranslation("settings")
  const setRSSHubMutation = useSetRSSHubMutation()
  const preset = useTOTPModalWrapper(setRSSHubMutation.mutateAsync)

  useEffect(() => {
    if (setRSSHubMutation.isSuccess) {
      dismiss()
    }
  }, [setRSSHubMutation.isSuccess, dismiss])

  return (
    <div className="max-w-[550px] space-y-4 lg:min-w-[550px]">
      <Card>
        <CardContent className="max-w-2xl space-y-2 p-6">
          <div className="mb-3 text-lg font-medium">{t("rsshub.useModal.about")}</div>
          <table className="w-full">
            <tbody className="divide-y-8 divide-transparent">
              <tr>
                <td className="w-24 text-sm text-text-secondary">{t("rsshub.table.owner")}</td>
                <td>
                  <UserAvatar
                    userId={instance.ownerUserId}
                    className="h-auto justify-start p-0"
                    avatarClassName="size-6"
                  />
                </td>
              </tr>
              <tr>
                <td className="text-sm text-text-secondary">{t("rsshub.table.description")}</td>
                <td className="line-clamp-2">{instance.description}</td>
              </tr>
              <tr>
                <td className="text-sm text-text-secondary">{t("rsshub.table.userCount")}</td>
                <td>{instance.userCount}</td>
              </tr>
              <tr>
                <td className="text-sm text-text-secondary">{t("rsshub.table.userLimit")}</td>
                <td>{instance.userLimit || t("rsshub.table.unlimited")}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          isLoading={setRSSHubMutation.isPending}
          onClick={() => preset({ id: instance.id })}
        >
          {t("rsshub.table.use")}
        </Button>
      </div>
    </div>
  )
}
