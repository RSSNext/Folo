import { UserRole } from "@follow/constants"
import * as FileSystem from "expo-file-system"
import type { ParseKeys } from "i18next"
import type { FC } from "react"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert, PixelRatio, View } from "react-native"

import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
} from "@/src/components/ui/grouped/GroupedList"
import { getDbPath } from "@/src/database"
import { BellRingingCuteFiIcon } from "@/src/icons/bell_ringing_cute_fi"
import { CertificateCuteFiIcon } from "@/src/icons/certificate_cute_fi"
import { DatabaseIcon } from "@/src/icons/database"
import { ExitCuteFiIcon } from "@/src/icons/exit_cute_fi"
import { LoveCuteFiIcon } from "@/src/icons/love_cute_fi"
import { Magic2CuteFiIcon } from "@/src/icons/magic_2_cute_fi"
import { PaletteCuteFiIcon } from "@/src/icons/palette_cute_fi"
import { RadaCuteFiIcon } from "@/src/icons/rada_cute_fi"
import { SafeLockFilledIcon } from "@/src/icons/safe_lock_filled"
import { Settings1CuteFiIcon } from "@/src/icons/settings_1_cute_fi"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { UserSettingCuteFiIcon } from "@/src/icons/user_setting_cute_fi"
import { signOut } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { Navigation } from "@/src/lib/navigation/Navigation"
import { InvitationScreen } from "@/src/screens/(modal)/invitation"
import { useRole, useWhoami } from "@/src/store/user/hooks"

import { AboutScreen } from "./routes/About"
import { AccountScreen } from "./routes/Account"
import { ActionsScreen } from "./routes/Actions"
import { AppearanceScreen } from "./routes/Appearance"
import { DataScreen } from "./routes/Data"
import { FeedsScreen } from "./routes/Feeds"
import { GeneralScreen } from "./routes/General"
import { InvitationsScreen } from "./routes/Invitations"
import { ListsScreen } from "./routes/Lists"
import { NotificationsScreen } from "./routes/Notifications"
import { PrivacyScreen } from "./routes/Privacy"

interface GroupNavigationLink {
  label: Extract<ParseKeys<"settings">, `titles.${string}`>
  icon: React.ElementType
  onPress: (data: { navigation: Navigation }) => void
  iconBackgroundColor: string
  trialNotAllowed?: boolean

  anonymous?: boolean
  todo?: boolean
}
const SettingGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "titles.general",
    icon: Settings1CuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(GeneralScreen)
    },
    iconBackgroundColor: "#FDA4AF",
  },
  {
    label: "titles.notifications",
    icon: BellRingingCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(NotificationsScreen)
    },
    iconBackgroundColor: "#FCA5A5",
    todo: true,
    anonymous: false,
  },
  {
    label: "titles.appearance",
    icon: PaletteCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AppearanceScreen)
    },
    iconBackgroundColor: "#C4B5FD",
  },
  {
    label: "titles.data_control",
    icon: DatabaseIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(DataScreen)
    },
    iconBackgroundColor: "#93C5FD",
    anonymous: false,
  },
  {
    label: "titles.account",
    icon: UserSettingCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AccountScreen)
    },
    iconBackgroundColor: "#FDBA74",
    anonymous: false,
  },
]

const BetaGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "titles.invitations",
    icon: LoveCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(InvitationsScreen)
    },

    iconBackgroundColor: "#F9A8D4",
    anonymous: false,
  },
]

const DataGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "titles.actions",
    icon: Magic2CuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(ActionsScreen)
    },
    iconBackgroundColor: "#D8B4FE",
    anonymous: false,
    trialNotAllowed: true,
  },

  {
    label: "titles.feeds",
    icon: CertificateCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(FeedsScreen)
    },
    iconBackgroundColor: "#FDE68A",
    todo: true,
    anonymous: false,
    trialNotAllowed: true,
  },
  {
    label: "titles.lists",
    icon: RadaCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(ListsScreen)
    },
    iconBackgroundColor: "#7DD3FC",
    anonymous: false,
    trialNotAllowed: true,
  },
]

const PrivacyGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "titles.privacy",
    icon: SafeLockFilledIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(PrivacyScreen)
    },
    iconBackgroundColor: "#A5B4FC",
  },
  {
    label: "titles.about",
    icon: StarCuteFiIcon,
    onPress: ({ navigation }) => {
      navigation.pushControllerView(AboutScreen)
    },
    iconBackgroundColor: "#FCD34D",
  },
]

const ActionGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "titles.sign_out",
    icon: ExitCuteFiIcon,
    onPress: () => {
      Alert.alert("Sign out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            // sign out
            await signOut()
            const dbPath = getDbPath()
            await FileSystem.deleteAsync(dbPath)
            await expo.reloadAppAsync("User sign out")
          },
        },
      ])
    },
    iconBackgroundColor: "#F87181",
    anonymous: false,
  },
]

const NavigationLinkGroup: FC<{
  links: GroupNavigationLink[]
}> = ({ links }) => {
  const navigation = useNavigation()
  const role = useRole()
  const { t } = useTranslation("settings")

  return (
    <GroupedInsetListCard>
      {links
        .filter((link) => !link.todo)
        .map((link) => {
          return (
            <GroupedInsetListNavigationLink
              key={link.label}
              label={t(link.label)}
              icon={
                <GroupedInsetListNavigationLinkIcon backgroundColor={link.iconBackgroundColor}>
                  <link.icon height={18} width={18} color="#fff" />
                </GroupedInsetListNavigationLinkIcon>
              }
              onPress={() => {
                if (link.trialNotAllowed && role === UserRole.Trial) {
                  navigation.presentControllerView(InvitationScreen)
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
  DataGroupNavigationLinks,
  SettingGroupNavigationLinks,
  BetaGroupNavigationLinks,
  PrivacyGroupNavigationLinks,
  ActionGroupNavigationLinks,
] as const

export const SettingsList: FC = () => {
  const whoami = useWhoami()

  const filteredNavigationGroups = useMemo(() => {
    if (whoami) return navigationGroups

    return navigationGroups
      .map((group) => {
        const filteredGroup = group.filter((link) => link.anonymous !== false)
        if (filteredGroup.length === 0) return false
        return filteredGroup
      })
      .filter((group) => group !== false)
  }, [whoami])

  const pixelRatio = PixelRatio.get()
  const groupGap = 100 / pixelRatio
  const marginTop = 44 / pixelRatio

  return (
    <View className="bg-system-grouped-background flex-1 pb-4" style={{ marginTop }}>
      {filteredNavigationGroups.map((group, index) => (
        <Fragment key={`nav-group-${index}`}>
          <NavigationLinkGroup key={`nav-group-${index}`} links={group} />
          {index < filteredNavigationGroups.length - 1 && <View style={{ height: groupGap }} />}
        </Fragment>
      ))}
    </View>
  )
}
