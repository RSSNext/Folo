import { cn, withOpacity } from "@follow/utils"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CheckLineIcon } from "@/src/icons/check_line"
import { useCanBack, useCanDismiss } from "@/src/lib/navigation/hooks"
import { StackScreenHeaderPortal } from "@/src/lib/navigation/StackScreenHeaderPortal"
import { useColor } from "@/src/theme/colors"

import { PlatformActivityIndicator } from "../../ui/loading/PlatformActivityIndicator"
import { DefaultHeaderBackButton, UINavigationHeaderActionButton } from "./NavigationHeader"

export interface ModalHeaderSubmitButtonProps {
  isValid: boolean
  onPress: () => void
  isLoading?: boolean
}
export const HeaderSubmitButton = ({
  isValid,
  onPress,
  isLoading,
}: ModalHeaderSubmitButtonProps) => {
  const label = useColor("label")
  return (
    <UINavigationHeaderActionButton onPress={onPress} disabled={!isValid || isLoading}>
      {isLoading ? (
        <PlatformActivityIndicator size="small" color={withOpacity(label, 0.5)} />
      ) : (
        <CheckLineIcon height={20} width={20} color={isValid ? label : withOpacity(label, 0.5)} />
      )}
    </UINavigationHeaderActionButton>
  )
}
export const HeaderSubmitTextButton = ({
  isValid,
  onPress,
  isLoading,
  label,
}: ModalHeaderSubmitButtonProps & {
  label?: string
}) => {
  const { t } = useTranslation("common")
  const labelColor = useColor("label")
  return (
    <UINavigationHeaderActionButton onPress={onPress} disabled={!isValid || isLoading}>
      {isLoading && (
        <View className="absolute inset-y-0 right-2 items-center justify-center">
          <PlatformActivityIndicator size="small" color={withOpacity(labelColor, 0.5)} />
        </View>
      )}
      <Text
        allowFontScaling={false}
        className={cn(
          "text-accent text-[16px] font-bold",
          !isValid && "text-secondary-label",
          isLoading && "opacity-0",
        )}
      >
        {label ?? t("words.submit")}
      </Text>
    </UINavigationHeaderActionButton>
  )
}
export const HeaderCloseOnly = () => {
  const insets = useSafeAreaInsets()
  const canDismiss = useCanDismiss()
  const canBack = useCanBack()
  return (
    <StackScreenHeaderPortal>
      <UINavigationHeaderActionButton
        className="absolute"
        style={{
          top: insets.top,
          left: insets.left,
        }}
      >
        <DefaultHeaderBackButton canGoBack={canBack} canDismiss={canDismiss} />
      </UINavigationHeaderActionButton>
    </StackScreenHeaderPortal>
  )
}
