import { Pressable } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { destination } from "@/src/lib/navigation/biz/Destination"
import { accentColor } from "@/src/theme/colors"

import { Logo } from "../ui/logo"

export function NoLoginInfo({ target }: { target: "timeline" | "subscriptions" }) {
  return (
    <Pressable
      className="flex-1 items-center justify-center gap-3"
      onPress={() => destination.Login()}
    >
      <Logo width={40} height={40} color={accentColor} />
      <Text className="text-secondary-label text-xl">{`Sign in to see your ${target}`}</Text>
    </Pressable>
  )
}
