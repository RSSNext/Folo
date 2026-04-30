import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import type { Manifest } from "expo-updates"
import * as Updates from "expo-updates"
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
  GroupedInsetListCell,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Logo } from "@/src/components/ui/logo"
import { Text } from "@/src/components/ui/typography/Text"
import { DiscordCuteFiIcon } from "@/src/icons/discord_cute_fi"
import { GithubCuteFiIcon } from "@/src/icons/github_cute_fi"
import { SocialXCuteReIcon } from "@/src/icons/social_x_cute_re"
import { useMobileReviewPromptState } from "@/src/modules/review-prompt/use-review-prompt-state"
import {
  isMobileNativeReviewAvailable,
  openMobileFeedbackEmail,
  openMobileStoreReview,
  persistMobileNegativeFeedback,
  readMobileReviewPromptState,
  requestMobileNativeReview,
} from "@/src/modules/review-prompt/utils"

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
    url: "https://discord.gg/AwWcAQ7euc",
    iconBackgroundColor: "#5865F2",
    iconColor: "#FFFFFF",
  },
]

const normalizeOtaVersion = (version: string | null | undefined) => {
  const normalizedVersion = version?.trim()
  return normalizedVersion || null
}

const resolveOtaReleaseVersion = (manifest: Partial<Manifest> | undefined) => {
  if (!manifest || !("metadata" in manifest)) {
    return null
  }

  const { metadata } = manifest
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const releaseVersion = Reflect.get(metadata, "releaseVersion")
  return typeof releaseVersion === "string" ? normalizeOtaVersion(releaseVersion) : null
}

export const AboutScreen = () => {
  const { t } = useTranslation("settings")
  const buildId = nativeBuildVersion
  const appVersion = nativeApplicationVersion
  const { currentlyRunning } = Updates.useUpdates()
  const otaVersion =
    resolveOtaReleaseVersion(currentlyRunning.manifest) ??
    normalizeOtaVersion(currentlyRunning.runtimeVersion) ??
    normalizeOtaVersion(Updates.runtimeVersion)
  const appVersionLabel = `${appVersion} (${buildId})${otaVersion ? ` · OTA ${otaVersion}` : ""}`
  const { distribution, platform, rateTarget, storageKey, userId } = useMobileReviewPromptState()

  const handleRateFolo = async () => {
    const latestState = readMobileReviewPromptState(storageKey)

    if (await isMobileNativeReviewAvailable(distribution)) {
      await requestMobileNativeReview({
        appVersion: appVersion ?? "unknown",
        distribution,
        platform,
        source: "manual",
        state: latestState,
        storageKey,
        trackPositive: true,
      })
      return
    }

    await openMobileStoreReview({
      appVersion: appVersion ?? "unknown",
      distribution,
      platform,
      source: "manual",
      state: latestState,
      storageKey,
      target: rateTarget,
    })
  }

  const handleSendFeedback = async () => {
    persistMobileNegativeFeedback({
      appVersion: appVersion ?? "unknown",
      distribution,
      platform,
      source: "manual",
      state: readMobileReviewPromptState(storageKey),
      storageKey,
    })
    await openMobileFeedbackEmail({ distribution, userId })
  }

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
            <Text className="mt-4 text-2xl font-semibold text-label">Folo</Text>
            <Text className="font-mono text-sm text-tertiary-label">{appVersionLabel}</Text>
          </View>
          <View className="mt-6 flex-1">
            <Trans
              ns="settings"
              i18nKey="about.feedbackInfo"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-[15px] text-label">{children}</Text>
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
                <Text className="mt-4 text-[15px] text-label">{children}</Text>
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
                <Text className="mt-4 text-[15px] text-label">{children}</Text>
              )}
              values={{
                currentYear: new Date().getFullYear(),
                appName: "Folo",
              }}
            />
          </View>
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("about.support")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("about.rateFolo")}
          description={t("about.rateFoloDescription")}
          onPress={() => {
            void handleRateFolo()
          }}
        />
        <GroupedInsetListCell
          label={t("about.sendFeedback")}
          description={t("about.sendFeedbackDescription")}
          onPress={() => {
            void handleSendFeedback()
          }}
        />
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
