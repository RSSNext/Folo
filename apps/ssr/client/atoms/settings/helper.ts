import { useRefValue } from "@follow/hooks"
import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { useAtomValue } from "jotai"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { useMemo } from "react"
import { shallow } from "zustand/shallow"

export const createSettingAtom = <T extends object>(
  settingKey: string,
  createDefaultSettings: () => T,
) => {
  const atom = atomWithStorage(getStorageNS(settingKey), createDefaultSettings(), undefined, {
    getOnInit: true,
  })

  const [, , useSettingValue, , getSettings, setSettings] = createAtomHooks(atom)

  const initializeDefaultSettings = () => {
    const currentSettings = getSettings()
    const defaultSettings = createDefaultSettings()
    if (typeof currentSettings !== "object") setSettings(defaultSettings)
    const newSettings = { ...defaultSettings, ...currentSettings }
    setSettings(newSettings)
  }

  const selectAtomCacheMap = {} as Record<keyof ReturnType<typeof getSettings>, any>

  const useSettingKey = <T extends keyof ReturnType<typeof getSettings>>(key: T) => {
    let selectedAtom = selectAtomCacheMap[key]
    if (!selectedAtom) {
      selectedAtom = selectAtom(atom, (s) => s[key])
      selectAtomCacheMap[key] = selectedAtom
    }

    return useAtomValue(selectedAtom) as ReturnType<typeof getSettings>[T]
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
    getSettings: typeof getSettings
    settingAtom: typeof atom
  }
}
