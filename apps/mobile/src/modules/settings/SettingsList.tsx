import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useIsFocused } from "@react-navigation/native"
import * as FileSystem from "expo-file-system"
import type { FC, RefObject } from "react"
import { Fragment, useContext, useEffect } from "react"
import type { ScrollView } from "react-native"
import { Alert, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
} from "@/src/components/ui/grouped/GroupedList"
import { SetBottomTabBarVisibleContext } from "@/src/contexts/BottomTabBarVisibleContext"
import { getDbPath } from "@/src/database"
import { BellRingingCuteFiIcon } from "@/src/icons/bell_ringing_cute_fi"
import { CertificateCuteFiIcon } from "@/src/icons/certificate_cute_fi"
import { DatabaseIcon } from "@/src/icons/database"
import { ExitCuteFiIcon } from "@/src/icons/exit_cute_fi"
import { Magic2CuteFiIcon } from "@/src/icons/magic_2_cute_fi"
import { PaletteCuteFiIcon } from "@/src/icons/palette_cute_fi"
import { RadaCuteFiIcon } from "@/src/icons/rada_cute_fi"
import { SafeLockFilledIcon } from "@/src/icons/safe_lock_filled"
import { Settings7CuteFiIcon } from "@/src/icons/settings_7_cute_fi"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { TrophyCuteFiIcon } from "@/src/icons/trophy_cute_fi"
import { User3CuteFiIcon } from "@/src/icons/user_3_cute_fi"
import { signOut } from "@/src/lib/auth"

import { useSettingsNavigation } from "./hooks"

interface GroupNavigationLink {
  label: string
  icon: React.ElementType
  onPress: (
    navigation: ReturnType<typeof useSettingsNavigation>,
    scrollRef: RefObject<ScrollView>,
  ) => void
  iconBackgroundColor: string

  todo?: boolean
}
const UserGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "Profile",
    icon: User3CuteFiIcon,
    onPress: (navigation, scrollRef) => {
      scrollRef.current?.scrollTo({ y: 0, animated: true })
      setTimeout(() => {
        navigation.navigate("Profile")
      }, 100)
    },
    iconBackgroundColor: "#4F46E5",
  },
  {
    label: "Achievement",
    icon: TrophyCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Achievement")
    },
    iconBackgroundColor: "#6366F1",
    todo: true,
  },
]

const SettingGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "General",
    icon: Settings7CuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("General")
    },
    iconBackgroundColor: "#F59E0B",
  },
  {
    label: "Notifications",
    icon: BellRingingCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Notifications")
    },
    iconBackgroundColor: "#FBBF24",
    todo: true,
  },
  {
    label: "Appearance",
    icon: PaletteCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Appearance")
    },
    iconBackgroundColor: "#FCD34D",
  },
  {
    label: "Data",
    icon: DatabaseIcon,
    onPress: (navigation) => {
      navigation.navigate("Data")
    },
    iconBackgroundColor: "#CBAD6D",
  },
]

const DataGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "Actions",
    icon: Magic2CuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Actions")
    },
    iconBackgroundColor: "#059669",
    todo: true,
  },

  {
    label: "Feeds",
    icon: CertificateCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Feeds")
    },
    iconBackgroundColor: "#10B981",
    todo: true,
  },
  {
    label: "Lists",
    icon: RadaCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("Lists")
    },
    iconBackgroundColor: "#34D399",
    // todo: true,
  },
]

const PrivacyGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "Privacy",
    icon: SafeLockFilledIcon,
    onPress: (navigation) => {
      navigation.navigate("Privacy")
    },
    iconBackgroundColor: "#EF4444",
  },
  {
    label: "About",
    icon: StarCuteFiIcon,
    onPress: (navigation) => {
      navigation.navigate("About")
    },
    iconBackgroundColor: "#F87181",
  },
]

const ActionGroupNavigationLinks: GroupNavigationLink[] = [
  {
    label: "Sign out",
    icon: ExitCuteFiIcon,
    onPress: () => {
      Alert.alert("Sign out", "Are you sure you want to sign out?", [
        {
          text: "Cancel",
          style: "cancel",
        },
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
  },
]

const NavigationLinkGroup: FC<{
  links: GroupNavigationLink[]
  navigation: ReturnType<typeof useSettingsNavigation>
  scrollRef: RefObject<ScrollView>
}> = ({ links, navigation, scrollRef }) => (
  <GroupedInsetListCard>
    {links.map((link) => (
      <GroupedInsetListNavigationLink
        key={link.label}
        label={link.label + (link.todo ? " (Coming Soon)" : "")}
        disabled={link.todo}
        icon={
          <GroupedInsetListNavigationLinkIcon backgroundColor={link.iconBackgroundColor}>
            <link.icon height={18} width={18} color="#fff" />
          </GroupedInsetListNavigationLinkIcon>
        }
        onPress={() => {
          if (link.todo) {
            return
          }
          link.onPress(navigation, scrollRef)
        }}
      />
    ))}
  </GroupedInsetListCard>
)

const navigationGroups = [
  UserGroupNavigationLinks,
  DataGroupNavigationLinks,
  SettingGroupNavigationLinks,
  PrivacyGroupNavigationLinks,
  ActionGroupNavigationLinks,
] as const

export const SettingsList: FC<{ scrollRef: RefObject<ScrollView> }> = ({ scrollRef }) => {
  const navigation = useSettingsNavigation()

  const setTabBarVisible = useContext(SetBottomTabBarVisibleContext)
  const isVisible = useIsFocused()
  useEffect(() => {
    if (isVisible) {
      setTabBarVisible(true)
    }
  }, [isVisible, setTabBarVisible])

  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  return (
    <View
      className="bg-system-grouped-background flex-1 py-4"
      style={{ paddingBottom: insets.bottom + tabBarHeight }}
    >
      {navigationGroups.map((group, index) => (
        <Fragment key={`nav-group-${index}`}>
          <NavigationLinkGroup
            key={`nav-group-${index}`}
            links={group}
            navigation={navigation}
            scrollRef={scrollRef}
          />
          {index < navigationGroups.length - 1 && <View className="h-8" />}
        </Fragment>
      ))}
    </View>
  )
}
