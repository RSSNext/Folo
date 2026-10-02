import { useWhoami } from "@follow/store/user/hooks"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import Siblings from "react-native-root-siblings"

import { getFetchErrorInfo } from "@/src/lib/error-parser"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { TwoFactorAuthScreen } from "@/src/screens/(modal)/TwoFactorAuthScreen"

import { OTPWindow } from "../components/OTPWindow"

export const useTOTPModalWrapper = <T extends { TOTPCode?: string }>(
  callback: (input: T) => Promise<any>,
  options?: { force?: boolean; dismiss?: () => any },
) => {
  const { t } = useTranslation("settings")
  const user = useWhoami()
  const navigation = useNavigation()
  return useCallback(
    async (input: T) => {
      const presentTOTPModal = () => {
        options?.dismiss?.()
        if (!user?.twoFactorEnabled) {
          toast.error(t("profile.two_factor.enable_notice"))

          navigation.pushControllerView(TwoFactorAuthScreen)

          return
        }

        const root = new Siblings(
          <OTPWindow
            verifyFn={async (TOTPCode) => {
              await callback({
                ...input,
                TOTPCode,
              })

              root.destroy()
            }}
            onDismiss={() => {
              root.destroy()
            }}
            onSuccess={async () => {
              root.destroy()
            }}
          />,
        )
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
    [callback, navigation, options, t, user?.twoFactorEnabled],
  )
}
