import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { env } from "@follow/shared/env.desktop"
import { inboxSyncService } from "@follow/store/inbox/store"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { createErrorToaster } from "~/lib/error-parser"

import { InboxForm } from "./InboxForm"

export const InboxEmail = ({ id }: { id: string }) => {
  return (
    <div className="group relative flex w-fit items-center gap-2">
      <span className="shrink-0">
        {id}
        {env.VITE_INBOXES_EMAIL}
      </span>
      <CopyButton
        value={`${id}${env.VITE_INBOXES_EMAIL}`}
        className="p-1 lg:absolute lg:-right-6 lg:opacity-0 lg:group-hover:opacity-100 [&_i]:size-3"
      />
    </div>
  )
}

export const InboxSecret = ({ secret }: { secret: string }) => {
  return (
    <div className="group relative flex w-fit items-center gap-2 font-mono">
      <span className="shrink-0">****</span>
      <CopyButton
        value={secret}
        className="p-1 lg:absolute lg:-right-6 lg:opacity-0 lg:group-hover:opacity-100 [&_i]:size-3"
      />
    </div>
  )
}

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

const ConfirmDestroyModalContent = ({ id }: { id: string }) => {
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
