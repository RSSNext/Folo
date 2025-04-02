import { cn, withOpacity } from "@follow/utils"
import { useCallback } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CheckLineIcon } from "@/src/icons/check_line"
import { CloseCuteReIcon } from "@/src/icons/close_cute_re"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"
import {
  useCanDismiss,
  useIsSingleRouteInGroup,
  useNavigation,
  useScreenIsInSheetModal,
} from "@/src/lib/navigation/hooks"
import { StackScreenHeaderPortal } from "@/src/lib/navigation/StackScreenHeaderPortal"
import { useColor } from "@/src/theme/colors"

import { RotateableLoading } from "../../common/RotateableLoading"
import { UINavigationHeaderActionButton } from "./NavigationHeader"

const HeaderCloseButton = () => {
  const label = useColor("label")

  const navigation = useNavigation()
  const canDismiss = useCanDismiss()
  const isInModal = useScreenIsInSheetModal()
  const isSingleRouteInGroup = useIsSingleRouteInGroup()

  const handlePress = useCallback(() => {
    if (canDismiss) {
      navigation.dismiss()
    } else {
      navigation.back()
    }
  }, [canDismiss, navigation])

  return (
    <TouchableOpacity onPress={handlePress}>
      {isInModal && isSingleRouteInGroup ? (
        <CloseCuteReIcon height={20} width={20} color={label} />
      ) : (
        <MingcuteLeftLineIcon height={20} width={20} color={label} />
      )}
    </TouchableOpacity>
  )
}

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
        <RotateableLoading size={20} color={withOpacity(label, 0.5)} />
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
  label = "Submit",
}: ModalHeaderSubmitButtonProps & {
  label?: string
}) => {
  const labelColor = useColor("label")
  return (
    <UINavigationHeaderActionButton onPress={onPress} disabled={!isValid || isLoading}>
      {isLoading && (
        <View className="absolute inset-y-0 right-2 items-center justify-center">
          <RotateableLoading size={20} color={withOpacity(labelColor, 0.5)} />
        </View>
      )}
      <Text
        className={cn(
          "text-accent text-base font-semibold",
          !isValid && "text-secondary-label",
          isLoading && "opacity-0",
        )}
      >
        {label}
      </Text>
    </UINavigationHeaderActionButton>
  )
}

export const HeaderCloseOnly = () => {
  const insets = useSafeAreaInsets()
  return (
    <StackScreenHeaderPortal>
      <UINavigationHeaderActionButton
        className="absolute left-4"
        style={{
          top: insets.top + 16,
        }}
      >
        <HeaderCloseButton />
      </UINavigationHeaderActionButton>
    </StackScreenHeaderPortal>
  )
}
