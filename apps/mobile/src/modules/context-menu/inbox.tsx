import { useInbox } from "@follow/store/inbox/hooks"
import { setStringAsync } from "expo-clipboard"
import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { toast } from "@/src/lib/toast"

type InboxContextMenuProps = PropsWithChildren<{
  inboxId: string
}>

export const InboxContextMenu = ({ inboxId, children }: InboxContextMenuProps) => {
  const { t } = useTranslation()
  const inbox = useInbox(inboxId)

  if (!inbox) {
    return children
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item
          key="CopyEmailAddress"
          onSelect={() => {
            setStringAsync(`${inbox.id}@follow.re`).then(() => {
              toast.success(
                t("operation.copy_which_success", { which: t("operation.copy.email_address") }),
              )
            })
          }}
        >
          <ContextMenu.ItemTitle>
            {t("operation.copy_which", { which: t("operation.copy.email_address") })}
          </ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "mail",
            }}
          />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
