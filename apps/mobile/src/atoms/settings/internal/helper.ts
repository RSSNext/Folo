import { useRefValue } from "@follow/hooks"
import { createAtomHooks } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import type { SetStateAction, WritableAtom } from "jotai"
import { atom as jotaiAtom, useAtomValue } from "jotai"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { useMemo } from "react"
import { shallow } from "zustand/shallow"

import { JotaiPersistSyncStorage } from "@/src/lib/jotai"

const getStorageNS = (settingKey: string) => `follow-rn-${settingKey}`
type Nullable<T> = T | null | undefined

export const createSettingAtom = <T extends object>(
  settingKey: string,
  createDefaultSettings: () => T,
) => {
  const atom = atomWithStorage(
    getStorageNS(settingKey),
    createDefaultSettings(),
    JotaiPersistSyncStorage,
    {
      getOnInit: true,
    },
  ) as WritableAtom<T, [SetStateAction<T>], void>

  const [, , useSettingValue, , getSettings, setSettings] = createAtomHooks(atom)

  const initializeDefaultSettings = () => {
    const currentSettings = getSettings()
    const defaultSettings = createDefaultSettings()
    if (typeof currentSettings !== "object") setSettings(defaultSettings)
    const newSettings = { ...defaultSettings, ...currentSettings }
    setSettings(newSettings)
  }

  const selectAtomCacheMap = {} as Record<keyof ReturnType<typeof getSettings>, any>

  const noopAtom = jotaiAtom(null)

  const useMaybeSettingKey = <T extends keyof ReturnType<typeof getSettings>>(key: Nullable<T>) => {
    // @ts-expect-error
    let selectedAtom: Record<keyof T, any>[T] | null = null
    if (key) {
      selectedAtom = selectAtomCacheMap[key]
      if (!selectedAtom) {
        selectedAtom = selectAtom(atom, (s) => s[key])
        selectAtomCacheMap[key] = selectedAtom
      }
    } else {
      selectedAtom = noopAtom
    }

    return useAtomValue(selectedAtom) as ReturnType<typeof getSettings>[T]
  }

  const useSettingKey = <T extends keyof ReturnType<typeof getSettings>>(key: T) => {
    return useMaybeSettingKey(key) as ReturnType<typeof getSettings>[T]
  }

  function useSettingKeys<
    T extends keyof ReturnType<typeof getSettings>,
    K1 extends T,
    K2 extends T,
    K3 extends T,
    K4 extends T,
    K5 extends T,
    K6 extends T,
    K7 extends T,
    K8 extends T,
    K9 extends T,
    K10 extends T,
  >(keys: [K1, K2?, K3?, K4?, K5?, K6?, K7?, K8?, K9?, K10?]) {
    return [
      useMaybeSettingKey(keys[0]),
      useMaybeSettingKey(keys[1]),
      useMaybeSettingKey(keys[2]),
      useMaybeSettingKey(keys[3]),
      useMaybeSettingKey(keys[4]),
      useMaybeSettingKey(keys[5]),
      useMaybeSettingKey(keys[6]),
      useMaybeSettingKey(keys[7]),
      useMaybeSettingKey(keys[8]),
      useMaybeSettingKey(keys[9]),
    ] as [
      ReturnType<typeof getSettings>[K1],
      ReturnType<typeof getSettings>[K2],
      ReturnType<typeof getSettings>[K3],
      ReturnType<typeof getSettings>[K4],
      ReturnType<typeof getSettings>[K5],
      ReturnType<typeof getSettings>[K6],
      ReturnType<typeof getSettings>[K7],
      ReturnType<typeof getSettings>[K8],
      ReturnType<typeof getSettings>[K9],
      ReturnType<typeof getSettings>[K10],
    ]
  }

  const useSettingSelector = <
    T extends keyof ReturnType<typeof getSettings>,
    S extends ReturnType<typeof getSettings>,
    R = S[T],
  >(
    selector: (s: S) => R,
  ): R => {
    const stableSelector = useRefValue(selector)

    return useAtomValue(
      // @ts-expect-error
      useMemo(() => selectAtom(atom, stableSelector.current, shallow), [stableSelector]),
    )
  }

  const setSetting = <K extends keyof ReturnType<typeof getSettings>>(
    key: K,
    value: ReturnType<typeof getSettings>[K],
  ) => {
    const updated = Date.now()

    EventBus.dispatch("SETTING_CHANGE_EVENT", {
      key: settingKey as "general" | "ui",
      payload: {
        [key]: value,
      },
    })
    setSettings({
      ...getSettings(),
      [key]: value,

      updated,
    })
  }

  const clearSettings = () => {
    setSettings(createDefaultSettings())
  }

  Object.defineProperty(useSettingValue, "select", {
    value: useSettingSelector,
  })

  return {
    useSettingKey,
    useSettingSelector,
    setSetting,
    clearSettings,
    initializeDefaultSettings,

    useSettingValue,
    useSettingKeys,
    getSettings,

    settingAtom: atom,
  } as {
    useSettingKey: typeof useSettingKey
    useSettingSelector: typeof useSettingSelector
    setSetting: typeof setSetting
    clearSettings: typeof clearSettings
    initializeDefaultSettings: typeof initializeDefaultSettings
    useSettingValue: typeof useSettingValue & {
      select: <T extends keyof ReturnType<() => T>>(key: T) => Awaited<T[T]>
    }
    useSettingKeys: typeof useSettingKeys
    getSettings: typeof getSettings
    settingAtom: typeof atom
  }
}
