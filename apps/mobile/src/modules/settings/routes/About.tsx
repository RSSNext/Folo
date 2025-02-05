import Constants from "expo-constants"
import { Link } from "expo-router"
import { Linking, Text, View } from "react-native"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Logo } from "@/src/components/ui/logo"
import { DiscordCuteFiIcon } from "@/src/icons/discord_cute_fi"
import { Github2CuteFiIcon } from "@/src/icons/github_2_cute_fi"
import { SocialXCuteReIcon } from "@/src/icons/social_x_cute_re"

const links = [
  {
    title: "Github",
    icon: Github2CuteFiIcon,
    url: "https://github.com/RSSNext/follow",
    iconBackgroundColor: "#000000",
    iconColor: "#FFFFFF",
  },
  {
    title: "X",
    icon: SocialXCuteReIcon,
    url: "https://x.com/follow_app_",
    iconBackgroundColor: "#000000",
    iconColor: "#FFFFFF",
  },
  {
    title: "Discord",
    icon: DiscordCuteFiIcon,
    url: "https://discord.gg/followapp",
    iconBackgroundColor: "#5865F2",
    iconColor: "#FFFFFF",
  },
]

export const AboutScreen = () => {
  const buildId = Constants.expoConfig?.extra?.eas?.buildId || "Development"
  const appVersion = Constants.expoConfig?.version || "0.0.0"

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="About" />

      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="flex-col py-6">
          <View className="flex-1 items-center justify-center">
            <Logo height={80} width={80} />
            <Text className="text-label font-sn mt-4 text-2xl font-semibold">Follow</Text>
            <Text className="text-tertiary-label font-mono text-sm">
              {appVersion} ({buildId})
            </Text>
          </View>
          <View className="mt-6 flex-1">
            <Text className="text-label text-[15px]">
              Follow is in the early stages of development. If you have any feedback or suggestions,
              please feel free to open an issue on the{" "}
              <Link className="text-accent" href="https://github.com/RSSNext/follow">
                GitHub repository
              </Link>
            </Text>

            <Text className="text-label mt-4 text-[15px]">
              The icon library used is copyrighted by{" "}
              <Link className="text-accent" href="https://mgc.mingcute.com/">
                https://mgc.mingcute.com/
              </Link>{" "}
              and cannot be redistributed.
            </Text>

            <Text className="text-label mt-4 text-[15px]">
              Copyright © 2025 Follow. All rights reserved.
            </Text>
          </View>
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>
      <View className="mt-10">
        <GroupedInsetListSectionHeader label="Social Links" />
        <GroupedInsetListCard>
          {links.map((link) => (
            <GroupedInsetListNavigationLink
              key={link.title}
              label={link.title}
              icon={
                <GroupedInsetListNavigationLinkIcon backgroundColor={link.iconBackgroundColor}>
                  <link.icon color={link.iconColor} height={18} width={18} />
                </GroupedInsetListNavigationLinkIcon>
              }
              onPress={() => Linking.openURL(link.url)}
            />
          ))}
        </GroupedInsetListCard>
      </View>
    </SafeNavigationScrollView>
  )
}
