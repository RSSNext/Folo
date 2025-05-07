import type { TextProps } from "react-native"
import { Text } from "react-native"
import type { StackPresentationTypes } from "react-native-screens"

import { useNavigation } from "./hooks"
import type { NavigationControllerView } from "./types"

interface NavigationLinkProps<T> extends TextProps {
  destination: NavigationControllerView<T>
  stackPresentation?: StackPresentationTypes
  props?: T
  ref?: React.Ref<Text>
}
export function NavigationLink<T>({
  destination,
  children,
  stackPresentation = "push",
  props,
  ref,
  ...rest
}: NavigationLinkProps<T>) {
  const navigation = useNavigation()

  return (
    <Text
      onPress={() => {
        if (stackPresentation === "push") {
          navigation.pushControllerView(destination, props)
        } else {
          navigation.presentControllerView(destination, props, stackPresentation)
        }
      }}
      {...rest}
      ref={ref}
    >
      {children}
    </Text>
  )
}
