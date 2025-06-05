import { Button } from "@follow/components/ui/button/index.js"
import { UserRole } from "@follow/constants"
import { repository } from "@pkg"
import { useTranslation } from "react-i18next"
import { useEventCallback } from "usehooks-ts"

import { useUserRole } from "~/atoms/user"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { CustomSafeError } from "~/errors/CustomSafeError"

import { useActivationModal } from "../activation"
import { InboxForm } from "./InboxForm"
import { InboxTable } from "./InboxTable"

const useCanCreateMoreInboxAndNotify = () => {
  const role = useUserRole()
  const presentActivationModal = useActivationModal()

  return useEventCallback(() => {
    if (role === UserRole.Trial) {
      const can = false
      if (!can) {
        presentActivationModal()

        throw new CustomSafeError(`Trial user cannot create more inboxes`, true)
      }
      return can
    } else {
      // const can = currentInboxCount < MAX_INBOX_COUNT
      // if (!can) {
      //   //  TODO
      // }
      // return can

      return true
    }
  })
}
export function DiscoverInboxList() {
  const { t } = useTranslation()

  const { present } = useModalStack()

  const preCheck = useCanCreateMoreInboxAndNotify()

  return (
    <div className="bg-material-ultra-thin mx-auto w-full max-w-[540px] rounded-lg border p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>{t("discover.inbox.description")}</span>
        <a
          href={`${repository.url}/wiki/Inbox#webhooks`}
          target="_blank"
          rel="noreferrer"
          className="text-accent border-accent inline-flex w-auto items-center gap-1 rounded-full border px-2 py-px text-sm"
        >
          <i className="i-mgc-book-6-cute-re" />
          <span>{t("discover.inbox.webhooks_docs")}</span>
        </a>
      </div>
      <InboxTable />
      <div className="center mt-4 flex">
        {/* New Inbox */}
        <Button
          textClassName="flex items-center gap-2"
          onClick={() =>
            preCheck() &&
            present({
              title: t("sidebar.feed_actions.new_inbox"),
              content: () => <InboxForm asWidget />,
            })
          }
        >
          <i className="i-mgc-add-cute-re" />
          {t("discover.inbox_create")}
        </Button>
      </div>
    </div>
  )
}
