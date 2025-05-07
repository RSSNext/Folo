import type { FC } from "react"
import { FadeIn, FadeOut } from "react-native-reanimated"

import { ReAnimatedPressable } from "../../common/AnimatedComponents"

export const Overlay: FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <ReAnimatedPressable
      entering={FadeIn}
      exiting={FadeOut}
      className={"absolute inset-0 bg-black/50"}
      onPress={onPress}
    />
  )
}
