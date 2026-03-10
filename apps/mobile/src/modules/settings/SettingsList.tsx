import { UserRole } from "@follow/constants"
import { useUserRole, useWhoami } from "@follow/store/user/hooks"
import type { StatusConfigs as ServerConfigs } from "@follow-app/client-sdk"
import type { FC } from "react"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert, PixelRatio, View } from "react-native"

import { getIsPaymentEnabled, useServerConfigs } from "@/src/atoms/server-configs"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
} from "@/src/components/ui/grouped/GroupedList"
import { CertificateCuteFiIcon } from "@/src/icons/certificate_cute_fi"
import { DatabaseIcon } from "@/src/icons/database"
import { ExitCuteFiIcon } from "@/src/icons/exit_cute_fi"
import { Magic2CuteFiIcon } from "@/src/icons/magic_2_cute_fi"
import { NotificationCuteReIcon } from "@/src/icons/notification_cute_re"
import { PaletteCuteFiIcon } from "@/src/icons/palette_cute_fi"
import { PowerOutlineIcon } from "@/src/icons/power_outline"
import { RadaCuteFiIcon } from "@/src/icons/rada_cute_fi"
import { SafeLockFilledIcon } from "@/src/icons/safe_lock_filled"
import { Settings1CuteFiIcon } from "@/src/icons/settings_1_cute_fi"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { UserSettingCuteFiIcon } from "@/src/icons/user_setting_cute_fi"
import { signOut } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { Navigation } from "@/src/lib/navigation/Navigation"
import { isPaymentFeatureEnabled } from "@/src/lib/payment"
import { accentColor } from "@/src/theme/colors"

import { AboutScreen } from "./routes/About"
import { AccountScreen } from "./routes/Account"
import { ActionsScreen } from "./routes/Actions"
import { AppearanceScreen } from "./routes/Appearance"
import { DataScreen } from "./routes/Data"
import { FeedsScreen } from "./routes/Feeds"
import { GeneralScreen } from "./routes/General"
import { ListsScreen } from "./routes/Lists"
import { NotificationsScreen } from "./routes/Notifications"
import { PlanScreen } from "./routes/Plan"
import { PrivacyScreen } from "./routes/Privacy"

type SettingsNavigationTranslationKey =
  | "titles.general"
  | "titles.notifications"
  | "titles.appearance"
  | "titles.data_control"
  | "titles.account"
  | "titles.subscription.short"
  | "titles.actions"
  | "titles.feeds"
  | "titles.lists"
  | "titles.privacy"
  | "titles.about"
  | "titles.sign_out"

interface GroupNavigationLinkBase {
  icon: React.ElementType
  onPress: (data: { navigation: Navigation }) => void
  iconBackgroundColor: string
  trialNotAllowed?: boolean
  anonymous?: boolean
  todo?: boolean
  hideIf?: (serverConfigs?: ServerConfigs | null) => boolean
  testID?: string
}

type GroupNavigationLink =
  | (GroupNavigationLinkBase & {
      translationKey: SettingsNavigationTranslationKey
      label?: never
    })
  | (GroupNavigationLinkBase & {
      label: string
      translationKey?: never
    })

const SettingGroupNavigationLinks: GroupNavigationLink[] = [
  {
    translationKey: "titles.general",
    icon: Settings1CuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(GeneralScreen)
    },
    iconBackgroundColor: "#F43F5E",
    testID: "settings-general-link",
  },
  {
    translationKey: "titles.notifications",
    icon: NotificationCuteReIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(NotificationsScreen)
    },
    iconBackgroundColor: "#EF4444",
    todo: true,
    anonymous: false,
  },
  {
    translationKey: "titles.appearance",
    icon: PaletteCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AppearanceScreen)
    },
    iconBackgroundColor: "#8B5CF6",
  },
  {
    translationKey: "titles.data_control",
    icon: DatabaseIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(DataScreen)
    },
    iconBackgroundColor: "#3B82F6",
    anonymous: false,
  },
  {
    translationKey: "titles.account",
    icon: UserSettingCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AccountScreen)
    },
    iconBackgroundColor: "#F97316",
    anonymous: false,
    testID: "settings-account-link",
  },
]

const SubscriptionGroupNavigationLinks: GroupNavigationLink[] = [
  {
    translationKey: "titles.subscription.short",
    icon: PowerOutlineIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(PlanScreen)
    },
    iconBackgroundColor: accentColor,
    anonymous: false,
    hideIf: (serverConfigs) => !isPaymentFeatureEnabled(serverConfigs?.PAYMENT_ENABLED),
  },
]

const DataGroupNavigationLinks: GroupNavigationLink[] = [
  {
    translationKey: "titles.actions",
    icon: Magic2CuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(ActionsScreen)
    },
    iconBackgroundColor: "#9333EA",
    anonymous: false,
    trialNotAllowed: true,
  },

  {
    translationKey: "titles.feeds",
    icon: CertificateCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(FeedsScreen)
    },
    iconBackgroundColor: "#EAB308",
    todo: true,
    anonymous: false,
    trialNotAllowed: true,
    testID: "settings-feeds-link",
  },
  {
    translationKey: "titles.lists",
    icon: RadaCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(ListsScreen)
    },
    iconBackgroundColor: "#0EA5E9",
    anonymous: false,
    trialNotAllowed: true,
  },
]

const PrivacyGroupNavigationLinks: GroupNavigationLink[] = [
  {
    translationKey: "titles.privacy",
    icon: SafeLockFilledIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(PrivacyScreen)
    },
    iconBackgroundColor: "#6366F1",
  },
  {
    translationKey: "titles.about",
    icon: StarCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AboutScreen)
    },
    iconBackgroundColor: "#EAB308",
  },
]

const ActionGroupNavigationLinks: GroupNavigationLink[] = [
  {
    translationKey: "titles.sign_out",
    icon: ExitCuteFiIcon,
    onPress: () => {
      Alert.alert("Sign out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut()
          },
        },
      ])
    },
    iconBackgroundColor: "#DC2626",
    anonymous: false,
    testID: "settings-sign-out",
  },
]

const NavigationLinkGroup: FC<{
  links: GroupNavigationLink[]
}> = ({ links }) => {
  const navigation = useNavigation()
  const role = useUserRole()
  const { t } = useTranslation("settings")

  return (
    <GroupedInsetListCard>
      {links
        .filter((link) => !link.todo)
        .map((link) => {
          const label = link.translationKey ? String(t(link.translationKey)) : link.label
          const key = link.testID ?? link.translationKey ?? link.label

          return (
            <GroupedInsetListNavigationLink
              key={key}
              label={label}
              icon={
                <GroupedInsetListNavigationLinkIcon backgroundColor={link.iconBackgroundColor}>
                  <link.icon height={18} width={18} color="#fff" />
                </GroupedInsetListNavigationLinkIcon>
              }
              testID={link.testID}
              onPress={() => {
                if (
                  link.trialNotAllowed &&
                  (role === UserRole.Free || role === UserRole.Trial) &&
                  getIsPaymentEnabled()
                ) {
                  navigation.presentControllerView(PlanScreen)
                } else {
                  link.onPress({ navigation })
                }
              }}
            />
          )
        })}
    </GroupedInsetListCard>
  )
}

const navigationGroups = [
  SettingGroupNavigationLinks,
  DataGroupNavigationLinks,
  SubscriptionGroupNavigationLinks,
  PrivacyGroupNavigationLinks,
  ActionGroupNavigationLinks,
] as const

export const SettingsList: FC = () => {
  const whoami = useWhoami()
  const serverConfigs = useServerConfigs()

  const filteredNavigationGroups = useMemo(() => {
    return navigationGroups
      .map((group) => {
        const filteredGroup = group
          .filter((link) => link.anonymous !== !!whoami)
          .filter((link) => !link.hideIf?.(serverConfigs))

        if (filteredGroup.length === 0) return false
        return filteredGroup
      })
      .filter((group): group is GroupNavigationLink[] => group !== false)
  }, [serverConfigs, whoami])

  const pixelRatio = PixelRatio.get()
  const groupGap = 100 / pixelRatio
  const marginTop = 44 / pixelRatio

  return (
    <View className="flex-1 bg-system-grouped-background pb-4" style={{ marginTop }}>
      {filteredNavigationGroups.map((group, index) => {
        const groupKey = group.map((link) => link.label).join("-")
        return (
          <Fragment key={groupKey}>
            <NavigationLinkGroup links={group} />
            {index < filteredNavigationGroups.length - 1 && <View style={{ height: groupGap }} />}
          </Fragment>
        )
      })}
    </View>
  )
}
