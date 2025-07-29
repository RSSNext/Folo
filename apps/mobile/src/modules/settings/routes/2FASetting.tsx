import { whoamiQueryKey } from "@follow/store/user/hooks"
import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"
import { KeyboardAvoidingView, View } from "react-native"
import type { OtpInputRef } from "react-native-otp-entry"
import { OtpInput } from "react-native-otp-entry"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { QRCode } from "@/src/components/ui/qrcode/QRCode"
import { Text } from "@/src/components/ui/typography/Text"
import { twoFactor } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { queryClient } from "@/src/lib/query-client"
import { toast } from "@/src/lib/toast"
import { accentColor, useColor } from "@/src/theme/colors"

const isAuthCodeValid = (code: string) => {
  return code.length === 6 && Number(code) > 0
}
export const TwoFASetting: NavigationControllerView<{
  totpURI: string
}> = ({ totpURI }) => {
  const label = useColor("label")
  const tertiaryLabel = useColor("tertiaryLabel")
  const navigation = useNavigation()
  const submitMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await twoFactor.verifyTotp({
        code: value,
      })
      if (res.error) {
        throw new Error(res.error.message)
      }
      await queryClient.invalidateQueries({
        queryKey: whoamiQueryKey,
      })
    },
    onError(error) {
      toast.error(`Failed to verify: ${error.message}`)
    },
    onSuccess() {
      navigation.back()
      toast.success("2FA enabled!")
    },
  })
  const otpInputRef = useRef<OtpInputRef>(null)
  return (
    <KeyboardAvoidingView behavior="padding">
      <SafeNavigationScrollView Header={<NavigationBlurEffectHeaderView title="Setting 2FA" />}>
        <View className="my-8 items-center justify-center">
          <QRCode
            data={totpURI}
            padding={20}
            pieceSize={7}
            pieceBorderRadius={4}
            isPiecesGlued
            color={label}
            preserveAspectRatio="none"
          />
        </View>

        <View className="mx-12">
          <Text className="text-secondary-label mb-8 text-sm">
            Scan the QR code above with your authenticator app, and then enter the 6-digit code
            which will be displayed in your authenticator app.
          </Text>
        </View>

        <OtpInput
          disabled={submitMutation.isPending}
          ref={otpInputRef}
          numberOfDigits={6}
          autoFocus
          focusColor={accentColor}
          theme={{
            containerStyle: {
              paddingHorizontal: 20,
            },
            pinCodeTextStyle: {
              color: label,
            },
            placeholderTextStyle: {
              color: tertiaryLabel,
            },
            filledPinCodeContainerStyle: {
              borderColor: label,
            },
            pinCodeContainerStyle: {
              borderColor: tertiaryLabel,
              aspectRatio: 1,
              width: 50,
            },
            focusedPinCodeContainerStyle: {
              borderColor: accentColor,
            },
          }}
          onFilled={(code) => {
            if (isAuthCodeValid(code)) {
              submitMutation.mutate(code)
            }
          }}
        />
      </SafeNavigationScrollView>
    </KeyboardAvoidingView>
  )
}
