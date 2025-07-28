import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import { Trans, useTranslation } from "react-i18next"
import { Linking, View } from "react-native"

import { Link } from "@/src/components/common/Link"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Logo } from "@/src/components/ui/logo"
import { Text } from "@/src/components/ui/typography/Text"
import { DiscordCuteFiIcon } from "@/src/icons/discord_cute_fi"
import { GithubCuteFiIcon } from "@/src/icons/github_cute_fi"
import { SocialXCuteReIcon } from "@/src/icons/social_x_cute_re"

const links = [
  {
    title: "GitHub",
    icon: GithubCuteFiIcon,
    url: "https://github.com/RSSNext/Folo",
    iconBackgroundColor: "#000000",
    iconColor: "#FFFFFF",
  },
  {
    title: "X",
    icon: SocialXCuteReIcon,
    url: "https://x.com/intent/follow?screen_name=folo_is",
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
  const { t } = useTranslation("settings")
  const buildId = nativeBuildVersion
  const appVersion = nativeApplicationVersion
  return (
    <SafeNavigationScrollView
      Header={<NavigationBlurEffectHeaderView title={t("titles.about")} />}
      className="bg-system-grouped-background"
      contentViewClassName="pt-6"
    >
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="flex-col py-6">
          <View className="flex-1 items-center justify-center">
            <Logo height={80} width={80} />
            <Text className="text-label mt-4 text-2xl font-semibold">Folo</Text>
            <Text className="text-tertiary-label font-mono text-sm">
              {appVersion} ({buildId})
            </Text>
          </View>
          <View className="mt-6 flex-1">
            <Trans
              ns="settings"
              i18nKey="about.feedbackInfo"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label text-[15px]">{children}</Text>
              )}
              values={{
                appName: "Folo",
                commitSha: `${appVersion}-${buildId}`,
              }}
              components={{
                OpenIssueLink: (
                  <Link className="text-accent" href="https://github.com/RSSNext/follow" />
                ),
                ExternalLinkIcon: <View />,
              }}
            />

            <Trans
              ns="settings"
              i18nKey="about.iconLibrary"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-4 text-[15px]">{children}</Text>
              )}
              components={{
                IconLibraryLink: (
                  <Link className="text-accent" href="https://mgc.mingcute.com/">
                    https://mgc.mingcute.com/
                  </Link>
                ),
                ExternalLinkIcon: <View />,
              }}
            />

            <Trans
              ns="settings"
              i18nKey="about.licenseInfo"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-4 text-[15px]">{children}</Text>
              )}
              values={{
                currentYear: new Date().getFullYear(),
                appName: "Folo",
              }}
            />
          </View>
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("about.socialMedia")} />
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
    </SafeNavigationScrollView>
  )
}
