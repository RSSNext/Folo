import { withOpacity } from "@follow/utils"
import { router } from "expo-router"
import { TouchableOpacity } from "react-native"

import { useIsRouteOnlyOne } from "@/src/hooks/useIsRouteOnlyOne"
import { CheckLineIcon } from "@/src/icons/check_line"
import { CloseCuteReIcon } from "@/src/icons/close_cute_re"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"
import { useColor } from "@/src/theme/colors"

import { RotateableLoading } from "./RotateableLoading"

export const ModalHeaderCloseButton = () => {
  return <ModalHeaderCloseButtonImpl />
}

const ModalHeaderCloseButtonImpl = () => {
  const label = useColor("label")

  const routeOnlyOne = useIsRouteOnlyOne()

  return (
    <TouchableOpacity onPress={() => router.dismiss()}>
      {routeOnlyOne ? (
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
export const ModalHeaderSubmitButton = ({
  isValid,
  onPress,
  isLoading,
}: ModalHeaderSubmitButtonProps) => {
  return <ModalHeaderShubmitButtonImpl isValid={isValid} onPress={onPress} isLoading={isLoading} />
}

const ModalHeaderShubmitButtonImpl = ({
  isValid,
  onPress,
  isLoading,
}: ModalHeaderSubmitButtonProps) => {
  const label = useColor("label")

  return (
    <TouchableOpacity onPress={onPress} disabled={!isValid || isLoading}>
      {isLoading ? (
        <RotateableLoading size={20} color={withOpacity(label, 0.5)} />
      ) : (
        <CheckLineIcon height={20} width={20} color={isValid ? label : withOpacity(label, 0.5)} />
      )}
    </TouchableOpacity>
  )
}
