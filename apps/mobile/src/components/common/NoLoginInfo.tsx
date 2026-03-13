import { Pressable, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { destination } from "@/src/lib/navigation/biz/Destination"
import { useReadableContainerStyle } from "@/src/lib/responsive"
import { accentColor } from "@/src/theme/colors"

import { Logo } from "../ui/logo"

export function NoLoginInfo({ target }: { target: "timeline" | "subscriptions" }) {
  const readableContainerStyle = useReadableContainerStyle(420)
  return (
    <Pressable
      testID={`no-login-${target}`}
      className="flex-1 items-center justify-center gap-3"
      onPress={() => destination.Login()}
    >
      <View className="items-center gap-3 px-6" style={readableContainerStyle}>
        <Logo width={40} height={40} color={accentColor} />
        <Text className="text-center text-xl text-secondary-label">
          {`Sign in to see your ${target}`}
        </Text>
      </View>
    </Pressable>
  )
}
