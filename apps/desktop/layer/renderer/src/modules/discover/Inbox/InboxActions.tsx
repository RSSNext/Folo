import { ActionButton } from "@follow/components/ui/button/action-button.js"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { InboxForm } from "../InboxForm"
import { ConfirmDestroyModalContent } from "./ConfirmDestroyModalContent"

export const InboxActions = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const { present } = useModalStack()
  return (
    <>
      <ActionButton
        size="sm"
        tooltip={t("discover.inbox_destroy")}
        onClick={() =>
          present({
            title: t("discover.inbox_destroy_confirm"),
            content: () => <ConfirmDestroyModalContent id={id} />,
          })
        }
      >
        <i className="i-mgc-delete-2-cute-re" />
      </ActionButton>
      <ActionButton
        size="sm"
        onClick={() => {
          present({
            title: t("sidebar.feed_actions.edit_inbox"),
            content: () => <InboxForm asWidget id={id} />,
          })
        }}
      >
        <i className="i-mgc-edit-cute-re" />
      </ActionButton>
    </>
  )
}
