import { t } from "i18next"
import { useEffect, useRef } from "react"
import { Alert, AppState, Linking, Platform } from "react-native"

import { nativeAlertCountAtom } from "@/src/lib/dialog-state"
import { jotaiStore } from "@/src/lib/jotai"
import { kv } from "@/src/lib/kv"
import { isAndroidApkInstall } from "@/src/lib/payment"

import type { StorePolicyResponse } from "./client"
import type { StoreUpdateTarget } from "./store-update"
import { getStoreUpdateTarget, shouldPromptStoreUpdate } from "./store-update"

export const storeUpdateDismissedVersionKey = "ota.store-update.dismissed-version"

export interface StoreUpdatePromptState {
  isShowing: boolean
  /** The version already prompted for in this launch */
  shownVersion: string | null
}

const openStore = async (target: StoreUpdateTarget) => {
  if (target.appUrl && (await Linking.canOpenURL(target.appUrl).catch(() => false))) {
    await Linking.openURL(target.appUrl)
    return
  }
  await Linking.openURL(target.url)
}

/**
 * Shows the store update alert when the policy asks for it. A prompt shows once per launch and
 * "Later" puts that version off; a blocked version asks every time this runs.
 */
export const showStoreUpdatePrompt = (
  policy: StorePolicyResponse,
  target: StoreUpdateTarget,
  state: StoreUpdatePromptState,
) => {
  if (state.isShowing) return
  // An alert raised in the background never appears, so wait until the app is in front
  if (AppState.currentState !== "active") return
  if (!shouldPromptStoreUpdate(policy, kv.getSync(storeUpdateDismissedVersionKey))) return
  const isBlocked = policy.action === "block"
  if (!isBlocked && state.shownVersion === policy.targetVersion) return

  state.isShowing = true
  state.shownVersion = policy.targetVersion
  // Counted like an app dialog so the review prompt doesn't open on top of it
  jotaiStore.set(nativeAlertCountAtom, (count) => count + 1)
  const close = () => {
    if (!state.isShowing) return
    state.isShowing = false
    jotaiStore.set(nativeAlertCountAtom, (count) => Math.max(0, count - 1))
  }
  const update = () => {
    close()
    openStore(target).catch(console.error)
  }

  Alert.alert(
    t(isBlocked ? "update.store.required_title" : "update.store.title"),
    policy.message ||
      t(isBlocked ? "update.store.required" : "update.store.message", {
        version: policy.targetVersion,
        store: t(`update.store.${target.store}`),
      }),
    isBlocked
      ? [{ text: t("update.store.update"), onPress: update }]
      : [
          {
            text: t("update.store.later"),
            style: "cancel",
            onPress: () => {
              close()
              kv.setSync(storeUpdateDismissedVersionKey, policy.targetVersion)
            },
          },
          { text: t("update.store.update"), onPress: update },
        ],
    // A blocked version must not be dismissed by tapping outside on Android
    { cancelable: !isBlocked, onDismiss: close },
  )
}

/** Asks the user to install a newer binary from the store when the OTA policy says so */
export const useStoreUpdatePrompt = (policy: StorePolicyResponse | null) => {
  const stateRef = useRef<StoreUpdatePromptState>({ isShowing: false, shownVersion: null })

  useEffect(() => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return
    if (!policy) return
    const target = getStoreUpdateTarget({
      platform: Platform.OS,
      isGooglePlayInstall: Platform.OS === "android" && !isAndroidApkInstall(),
    })
    if (!target) return

    const show = () => showStoreUpdatePrompt(policy, target, stateRef.current)
    show()
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") show()
    })
    return () => subscription.remove()
  }, [policy])
}
