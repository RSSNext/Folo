import type { PropsWithChildren } from "react"
import type { TextProps } from "react-native"
import { Linking, Text } from "react-native"

export const Link = ({
  href,
  children,
  ...props
}: PropsWithChildren<{ href: string } & TextProps>) => {
  return (
    <Text
      className="text-accent"
      onPress={async () => {
        const canOpen = await Linking.canOpenURL(href)
        if (canOpen) {
          Linking.openURL(href)
        }
      }}
      {...props}
    >
      {children}
    </Text>
  )
}
