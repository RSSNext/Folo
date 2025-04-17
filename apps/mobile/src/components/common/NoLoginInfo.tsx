import { Pressable, Text } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { useNavigation } from "@/src/lib/navigation/hooks"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"

import { Logo } from "../ui/logo"

export function NoLoginInfo({ target }: { target: "timeline" | "subscriptions" }) {
  const color = useColor("secondaryLabel")
  const navigation = useNavigation()

  return (
    <Pressable
      className="flex-1 items-center justify-center gap-3"
      onPress={() => navigation.presentControllerView(LoginScreen)}
    >
      <Logo width={40} height={40} color={color} />
      <Text className="text-secondary-label text-xl">{`Sign in to see your ${target}`}</Text>
    </Pressable>
  )
}
