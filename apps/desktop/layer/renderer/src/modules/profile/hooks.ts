import { isMobile } from "@follow/components/hooks/useMobile.js"
import { usePrefetchUser } from "@follow/store/user/hooks"
import { capitalizeFirstLetter } from "@follow/utils/utils"
import { createElement, lazy, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { parse } from "tldts"

import { useWhoami } from "~/atoms/user"
import { useAsyncModal } from "~/components/ui/modal/helper/useAsyncModal"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { getFetchErrorInfo } from "~/lib/error-parser"

import { TOTPForm, TwoFactorForm } from "./two-factor"

const LazyUserProfileModalContent = lazy(() =>
  import("./user-profile-modal").then((mod) => ({ default: mod.UserProfileModalContent })),
)

export const useUserSubscriptionsQuery = (userId: string | undefined) => {
  const subscriptions = useAuthQuery(
    defineQuery(["subscriptions", "group", userId], async () => {
      const res = await apiClient.subscriptions.$get({
        query: { userId },
      })
      const groupFolder = {} as Record<string, typeof res.data>

      for (const subscription of res.data || []) {
        if (!subscription.category && "feeds" in subscription) {
          const { siteUrl } = subscription.feeds
          if (!siteUrl) continue
          const parsed = parse(siteUrl)
          parsed.domain && (subscription.category = capitalizeFirstLetter(parsed.domain))
        }
        if (subscription.category) {
          if (!groupFolder[subscription.category]) {
            groupFolder[subscription.category] = []
          }
          groupFolder[subscription.category]!.push(subscription)
        }
      }

      return groupFolder
    }),
    {
      enabled: !!userId,
    },
  )
  return subscriptions
}

type Variant = "drawer" | "dialog"
export const usePresentUserProfileModal = (variant: Variant = "dialog") => {
  const { present } = useModalStack()
  const presentAsync = useAsyncModal()
  return useCallback(
    (userId: string | undefined, overrideVariant?: Variant) => {
      if (!userId) return
      const finalVariant = overrideVariant || variant

      if (isMobile()) {
        const useDataFetcher = () => {
          const user = usePrefetchUser(userId)
          const subscriptions = useUserSubscriptionsQuery(user?.data?.id)
          return {
            ...user,
            isLoading: user.isLoading || subscriptions.isLoading,
          }
        }
        type ResponseType = ReturnType<typeof useDataFetcher>["data"]
        return presentAsync<ResponseType>({
          id: `user-profile-${userId}`,
          title: (data: ResponseType) => `${data?.name}'s Profile`,

          content: () => createElement(LazyUserProfileModalContent, { userId }),
          useDataFetcher,
          overlay: true,
        })
      }

      present({
        title: "User Profile",
        id: `user-profile-${userId}`,
        content: () =>
          createElement(LazyUserProfileModalContent, {
            userId,
            variant: finalVariant,
          }),
        CustomModalComponent: PlainModal,
        clickOutsideToDismiss: true,
        modal: finalVariant === "dialog",
        overlay: finalVariant === "dialog",
        autoFocus: false,
        modalContainerClassName:
          finalVariant === "drawer"
            ? tw`right-4 left-[auto] safe-inset-top-4 bottom-4`
            : "overflow-hidden",
      })
    },
    [present, presentAsync, variant],
  )
}

export function useTOTPModalWrapper<T extends { TOTPCode?: string }>(
  callback: (input: T) => Promise<any>,
  options?: { force?: boolean },
) {
  const { present } = useModalStack()
  const { t } = useTranslation("settings")
  const user = useWhoami()
  return useCallback(
    async (input: T) => {
      const presentTOTPModal = () => {
        if (!user?.twoFactorEnabled) {
          toast.error(t("profile.two_factor.enable_notice"))
          present({
            title: t("profile.two_factor.enable"),
            content: TwoFactorForm,
          })
          return
        }

        present({
          title: t("profile.totp_code.title"),
          content: ({ dismiss }) => {
            return createElement(TOTPForm, {
              async onSubmitMutationFn(values) {
                await callback({
                  ...input,
                  TOTPCode: values.code,
                })
                dismiss()
              },
            })
          },
        })
      }

      if (options?.force) {
        presentTOTPModal()
        return
      }

      try {
        await callback(input)
      } catch (error) {
        const { code } = getFetchErrorInfo(error as Error)
        if (code === 4008) {
          presentTOTPModal()
        }
      }
    },
    [callback, options?.force, present, t, user?.twoFactorEnabled],
  )
}
