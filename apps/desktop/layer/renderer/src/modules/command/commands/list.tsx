import { IN_ELECTRON } from "@follow/shared/constants"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useDeleteSubscription } from "~/hooks/biz/useSubscriptionActions"
import { copyToClipboard } from "~/lib/clipboard"
import { UrlBuilder } from "~/lib/url-builder"
import { ListForm } from "~/modules/discover/ListForm"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

const category: CommandCategory = "category.list"
export const useRegisterListCommands = () => {
  const { t } = useTranslation()

  const { mutateAsync: deleteSubscription } = useDeleteSubscription()
  const navigateEntry = useNavigateEntry()
  const { present } = useModalStack()

  useRegisterCommandEffect([
    {
      id: COMMAND_ID.list.edit,
      label: t("sidebar.feed_actions.edit"),
      category,
      run: ({ listId }) => {
        if (!listId) return
        present({
          title: t("sidebar.feed_actions.edit_list"),
          content: ({ dismiss }) => <ListForm id={listId} onSuccess={dismiss} />,
        })
      },
    },
    {
      id: COMMAND_ID.list.unfollow,
      label: t("sidebar.feed_actions.unfollow"),
      category,
      run: ({ subscription }) => deleteSubscription({ subscription }),
    },
    {
      id: COMMAND_ID.list.navigateTo,
      label: t("sidebar.feed_actions.navigate_to_list"),
      category,
      run: ({ listId }) => {
        if (!listId) return
        navigateEntry({ listId })
      },
    },
    {
      id: COMMAND_ID.list.openInBrowser,
      label: t("sidebar.feed_actions.open_list_in_browser", {
        which: IN_ELECTRON ? t("words.browser") : t("words.newTab"),
      }),
      category,
      run: ({ listId }) => {
        if (!listId) return
        const { view } = getRouteParams()
        window.open(UrlBuilder.shareList(listId, view), "_blank")
      },
    },
    {
      id: COMMAND_ID.list.copyUrl,
      label: t("sidebar.feed_actions.copy_list_url"),
      category,
      run: async ({ listId }) => {
        if (!listId) return
        const { view } = getRouteParams()
        await copyToClipboard(UrlBuilder.shareList(listId, view))
        toast.success("copy success!", {
          duration: 1000,
        })
      },
    },
    {
      id: COMMAND_ID.list.copyId,
      label: t("sidebar.feed_actions.copy_list_id"),
      category,
      run: async ({ listId }) => {
        if (!listId) return
        await copyToClipboard(listId)
        toast.success("copy success!", {
          duration: 1000,
        })
      },
    },
  ])
}
