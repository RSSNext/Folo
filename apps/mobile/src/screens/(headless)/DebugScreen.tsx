import type { envProfileMap } from "@follow/shared/env.rn"
import { whoami } from "@follow/store/user/getters"
import { sleep } from "@follow/utils"
import { requireNativeModule } from "expo"
import * as Clipboard from "expo-clipboard"
import * as FileSystem from "expo-file-system"
import * as SecureStore from "expo-secure-store"
import type { FC } from "react"
import * as React from "react"
import { useRef, useState } from "react"
import {
  Alert,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Select } from "@/src/components/ui/form/Select"
import { Text } from "@/src/components/ui/typography/Text"
import { getDbPath } from "@/src/database"
import { cookieKey, getCookie, sessionTokenKey, signOut } from "@/src/lib/auth"
import { loading } from "@/src/lib/loading"
import { DebugButtonGroup } from "@/src/lib/navigation/debug/DebugButtonGroup"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { NavigationSitemapRegistry } from "@/src/lib/navigation/sitemap/registry"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { setEnvProfile, useEnvProfile } from "@/src/lib/proxy-env"
import { toast } from "@/src/lib/toast"

import { ProfileScreen } from "../(modal)/ProfileScreen"
import { MarkdownScreen } from "./(debug)/markdown"
import { TextDebugScreen } from "./(debug)/text"

interface MenuSection {
  title: string
  items: (MenuItem | FC)[]
}
interface MenuItem {
  title: string
  onPress: () => Promise<void> | void
  textClassName?: string
}
export const DebugScreen: NavigationControllerView = () => {
  const insets = useSafeAreaInsets()
  const envProfile = useEnvProfile()
  const menuSections: MenuSection[] = [
    {
      title: "Users",
      items: [
        UserSessionSetting,
        {
          title: "Get Current Session Token",
          onPress: async () => {
            const token = getCookie()
            Alert.alert(`Current Session Token: ${token}`)
          },
        },
        {
          title: "Clear Session Token",
          onPress: async () => {
            await signOut()
            Alert.alert("Session Token Cleared")
          },
        },
      ],
    },
    {
      title: "Data Control",
      items: [
        {
          title: "Copy Sqlite File Location",
          onPress: async () => {
            const dbPath = getDbPath()
            await Clipboard.setStringAsync(dbPath)
          },
        },
        {
          title: "Copy Cache Directory",
          onPress: async () => {
            const { cacheDirectory } = FileSystem
            if (!cacheDirectory) {
              return
            }
            await Clipboard.setStringAsync(cacheDirectory)
          },
        },
        {
          title: "Clear Sqlite Data",
          textClassName: "!text-red",
          onPress: async () => {
            Alert.alert("Clear Sqlite Data?", "This will delete all your data", [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Clear",
                style: "destructive",
                async onPress() {
                  const dbPath = getDbPath()
                  await FileSystem.deleteAsync(dbPath)
                  await expo.reloadAppAsync("Clear Sqlite Data")
                },
              },
            ])
          },
        },
      ],
    },
    {
      title: "Debug",
      items: [
        {
          title: "Reload App",
          onPress: () => expo.reloadAppAsync("Reload App"),
        },
        {
          title: "Loading",
          onPress: () => {
            loading.start(sleep(2000))
          },
        },
        {
          title: "Toast",
          onPress: () => {
            toast.success("Hello, world!".repeat(3))
          },
        },
        {
          title: "Glow Effect",
          onPress: () => {
            requireNativeModule("AppleIntelligenceGlowEffect").show()
          },
        },
        {
          title: "Hide Glow Effect",
          onPress: () => {
            requireNativeModule("AppleIntelligenceGlowEffect").hide()
          },
        },
        {
          title: "Testing Native Scroll To Top",
          onPress: async () => {
            await requireNativeModule("Helper").scrollToTop(findNodeHandle(ref.current))
          },
        },
        {
          title: "Test navigation",
          onPress: () => {
            navigation.pushControllerView(DebugButtonGroup)
          },
        },
        {
          title: "Markdown",
          onPress: () => {
            navigation.pushControllerView(MarkdownScreen)
          },
        },
        {
          title: "TextSizeView",
          onPress: () => {
            navigation.pushControllerView(TextDebugScreen)
          },
        },
        {
          title: "Present Profile Modal",
          onPress: () => {
            navigation.presentControllerView(ProfileScreen, {
              userId: whoami()!.id,
            })
          },
        },
      ],
    },
  ]
  const ref = useRef<ScrollView>(null)
  const navigation = useNavigation()
  return (
    <ScrollView
      ref={ref}
      className="flex-1 bg-black"
      style={{
        paddingTop: insets.top,
      }}
    >
      <View className="flex-row items-center justify-between px-8">
        <Text className="text-2xl font-medium text-white">Current Env Profile: {envProfile}</Text>
        <Select
          options={[
            {
              label: "Dev",
              value: "dev",
            },
            {
              label: "Prod",
              value: "prod",
            },
            {
              label: "Staging",
              value: "staging",
            },
            {
              label: "Local",
              value: "local",
            },
          ]}
          value={envProfile}
          onValueChange={(value) => {
            setEnvProfile(value as keyof typeof envProfileMap)
          }}
        />
      </View>
      {menuSections.map((section) => (
        <View key={section.title}>
          <Text className="mt-4 px-8 text-2xl font-medium text-white">{section.title}</Text>
          <View style={styles.container}>
            <View style={styles.itemContainer}>
              {section.items.map((item, index) => {
                if (typeof item === "function") {
                  return React.createElement(item, {
                    key: index,
                  })
                }
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={styles.itemPressable}
                    onPress={item.onPress}
                  >
                    <Text style={styles.filename} className={item.textClassName}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      ))}

      <Text className="mt-4 px-8 text-2xl font-medium text-white">Sitemap</Text>
      <View style={styles.container}>
        <View style={styles.itemContainer}>
          {NavigationSitemapRegistry.entries().map(([title, register]) => {
            return (
              <TouchableOpacity
                key={title}
                style={styles.itemPressable}
                onPress={() => {
                  const { Component, props, stackPresentation } = register
                  if (stackPresentation === "push") {
                    navigation.pushControllerView(Component, props)
                  } else {
                    navigation.presentControllerView(Component, props, stackPresentation)
                  }
                }}
              >
                <Text style={styles.filename}>{title}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}
const UserSessionSetting = () => {
  const [input, setInput] = useState("")
  const inputRef = useRef<TextInput>(null)
  return (
    <Pressable
      style={styles.itemPressable}
      className="flex-row justify-between"
      onPress={() => {
        inputRef.current?.focus()
      }}
    >
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="w-0 flex-1 text-white"
        ref={inputRef}
        placeholder="Session Token"
        value={input}
        onChangeText={setInput}
      />
      <TouchableOpacity
        className="ml-2"
        onPress={() => {
          SecureStore.setItem(
            cookieKey,
            JSON.stringify({
              [sessionTokenKey]: {
                value: input,
              },
            }),
          )
          Alert.alert("Session Token Saved")
        }}
      >
        <Text className="font-medium text-white">Save</Text>
      </TouchableOpacity>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: "5%",
    paddingVertical: 16,
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: "#313538",
    backgroundColor: "#151718",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  itemPressable: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filename: {
    color: "white",
    fontSize: 20,
    marginLeft: 12,
  },
})
