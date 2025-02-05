/**
 * @description only for iOS modal
 *
 * ```
 * Set screen options:
 *   +  headerTransparent: true,
 *   +  headerBackground: BlurEffectWithBottomBorder,
 * ```
 */
import { useHeaderHeight } from "@react-navigation/elements"
import type { KeyboardAwareScrollViewProps } from "react-native-keyboard-controller"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface SafeModalScrollViewProps extends KeyboardAwareScrollViewProps {}
export const SafeModalScrollView = (props: SafeModalScrollViewProps) => {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAwareScrollView
      {...props}
      scrollIndicatorInsets={{ top: headerHeight, bottom: insets.bottom }}
      contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom }}
    >
      {props.children}
    </KeyboardAwareScrollView>
  )
}
