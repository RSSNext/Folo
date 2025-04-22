import { Pressable, Text } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { destination } from "@/src/lib/navigation/biz/Destination"

import { Logo } from "../ui/logo"

export function NoLoginInfo({ target }: { target: "timeline" | "subscriptions" }) {
  const color = useColor("secondaryLabel")

  return (
    <Pressable
      className="flex-1 items-center justify-center gap-3"
      onPress={() => destination.Login()}
    >
      <Logo width={40} height={40} color={color} />
      <Text className="text-secondary-label text-xl">{`Sign in to see your ${target}`}</Text>
    </Pressable>
  )
}
