import { useAtomValue } from "jotai"
import { use, useMemo } from "react"
import { View } from "react-native"

import { CenteredToast } from "./CenteredToast"
import { ToastContainerContext } from "./ctx"
import type { ToastProps } from "./types"

export const ToastContainer = () => {
  const stackAtom = use(ToastContainerContext)
  const stack = useAtomValue(stackAtom)

  const { renderCenterReplaceToast, renderBottomStackToasts } = useMemo(() => {
    const { centerToasts, bottomToasts } = stack.reduce(
      (acc, toast) => {
        if (toast.variant === "center-replace") {
          acc.centerToasts.push(toast)
        } else if (toast.variant === "bottom-stack") {
          acc.bottomToasts.push(toast)
        }
        return acc
      },
      { centerToasts: [] as ToastProps[], bottomToasts: [] as ToastProps[] },
    )

    const renderCenterReplaceToast =
      centerToasts.length > 0
        ? centerToasts.reduce((latest, toast) =>
            latest.currentIndex > toast.currentIndex ? latest : toast,
          )
        : null

    const renderBottomStackToasts = bottomToasts.sort((a, b) => a.currentIndex - b.currentIndex)

    return { renderCenterReplaceToast, renderBottomStackToasts }
  }, [stack])

  void renderBottomStackToasts

  return (
    <View className="absolute inset-0" pointerEvents="box-only">
      {/* Center replace container */}
      <View className="absolute inset-0 items-center justify-center px-5" pointerEvents="box-only">
        {renderCenterReplaceToast && <CenteredToast {...renderCenterReplaceToast} />}
      </View>
      {/* Bottom stack */}
      {/* <View className="absolute bottom-safe" pointerEvents="box-only"></View> */}
    </View>
  )
}
