import { useWhoami } from "@follow/store/user/hooks"
import { useCallback } from "react"
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
  const user = useWhoami()
  const navigation = useNavigation()
  return useCallback(
    async (input: T) => {
      const presentTOTPModal = () => {
        options?.dismiss?.()
        if (!user?.twoFactorEnabled) {
          toast.error("You need to enable two-factor authentication to perform this action.")

          navigation.pushControllerView(TwoFactorAuthScreen)

          return
        }

        const root = new Siblings(
          (
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
            />
          ),
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
    [callback, navigation, options, user?.twoFactorEnabled],
  )
}
