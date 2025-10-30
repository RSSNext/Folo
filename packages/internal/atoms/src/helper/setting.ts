import { UserRole } from "@follow/constants"
import { useRefValue } from "@follow/hooks"
import { getSettingPaidLevel, SettingPaidLevels } from "@follow/shared/settings/constants"
import { useUserStore } from "@follow/store/user/store"
import { EventBus } from "@follow/utils/event-bus"
import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { atom as jotaiAtom, useAtomValue } from "jotai"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { useMemo } from "react"
import { shallow } from "zustand/shallow"

declare module "@follow/utils/event-bus" {
  interface CustomEvent {
    SETTING_CHANGE_EVENT: {
      updated: number
      payload: Record<string, any>
      key: string
    }
  }
}

export const createSettingAtom = <T extends object>(
  settingKey: string,
  createDefaultSettings: () => T,
) => {
  const atom = atomWithStorage(getStorageNS(settingKey), createDefaultSettings(), undefined, {
    getOnInit: true,
  })

  const [, , useSettingValueRaw, , getSettingsRaw, setSettings] = createAtomHooks(atom)

  const initializeDefaultSettings = () => {
    const currentSettings = getSettingsRaw()
    const defaultSettings = createDefaultSettings()
    if (typeof currentSettings !== "object") setSettings(defaultSettings)
    const newSettings = { ...defaultSettings, ...currentSettings }
    setSettings(newSettings)
  }

  const selectAtomCacheMap = {} as Record<keyof ReturnType<typeof getSettingsRaw>, any>

  const noopAtom = jotaiAtom(null)

  const canUpdatePaidSetting = (requiredLevel?: SettingPaidLevels) => {
    if (requiredLevel === undefined) return true
    if (
      requiredLevel === SettingPaidLevels.Free ||
      requiredLevel === SettingPaidLevels.FreeLimited
    ) {
      return true
    }
    const role = useUserStore.getState().role ?? UserRole.Free
    return role !== UserRole.Free && role !== UserRole.Trial
  }

  const resolveAccessibleValue = (
    key: string,
    value: unknown,
    defaults: Record<string, unknown>,
  ) => {
    const requiredLevel = getSettingPaidLevel(settingKey, key)
    if (requiredLevel === undefined || canUpdatePaidSetting(requiredLevel)) {
      return value
    }
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      return defaults[key]
    }
    return value
  }

  const sanitizeSettingsSnapshot = (settings: ReturnType<typeof getSettingsRaw>) => {
    const defaults = createDefaultSettings() as Record<string, unknown>
    const raw = settings as Record<string, unknown>
    let sanitized: Record<string, unknown> | null = null

    for (const key of Object.keys(defaults)) {
      const safeValue = resolveAccessibleValue(key, raw[key], defaults)
      if (safeValue !== raw[key]) {
        if (!sanitized) sanitized = { ...raw }
        sanitized[key] = safeValue
      }
    }

    return (sanitized ?? raw) as ReturnType<typeof getSettingsRaw>
  }

  const useMaybeSettingKey = <T extends keyof ReturnType<typeof getSettingsRaw>>(
    key: Nullable<T>,
  ) => {
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

    const value = useAtomValue(selectedAtom) as ReturnType<typeof getSettingsRaw>[T]
    if (!key) return value
    const defaults = createDefaultSettings() as Record<string, unknown>
    return resolveAccessibleValue(String(key), value, defaults) as ReturnType<
      typeof getSettingsRaw
    >[T]
  }

  const useSettingKey = <T extends keyof ReturnType<typeof getSettingsRaw>>(key: T) => {
    return useMaybeSettingKey(key) as ReturnType<typeof getSettingsRaw>[T]
  }

  function useSettingKeys<
    T extends keyof ReturnType<typeof getSettingsRaw>,
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
      ReturnType<typeof getSettingsRaw>[K1],
      ReturnType<typeof getSettingsRaw>[K2],
      ReturnType<typeof getSettingsRaw>[K3],
      ReturnType<typeof getSettingsRaw>[K4],
      ReturnType<typeof getSettingsRaw>[K5],
      ReturnType<typeof getSettingsRaw>[K6],
      ReturnType<typeof getSettingsRaw>[K7],
      ReturnType<typeof getSettingsRaw>[K8],
      ReturnType<typeof getSettingsRaw>[K9],
      ReturnType<typeof getSettingsRaw>[K10],
    ]
  }

  const useSettingSelector = <
    T extends keyof ReturnType<typeof getSettingsRaw>,
    S extends ReturnType<typeof getSettingsRaw>,
    R = S[T],
  >(
    selector: (s: S) => R,
  ): R => {
    const stableSelector = useRefValue(selector)

    return useAtomValue(
      useMemo(
        () =>
          selectAtom(
            atom,
            (state) => stableSelector.current(sanitizeSettingsSnapshot(state) as S),
            shallow,
          ),
        [stableSelector],
      ),
    )
  }

  const setSetting = <K extends keyof ReturnType<typeof getSettingsRaw>>(
    key: K,
    value: ReturnType<typeof getSettingsRaw>[K],
  ) => {
    const requiredLevel = getSettingPaidLevel(settingKey, String(key))
    if (!canUpdatePaidSetting(requiredLevel)) {
      return
    }
    const updated = Date.now()
    setSettings({
      ...getSettingsRaw(),
      [key]: value,

      updated,
    })

    EventBus.dispatch("SETTING_CHANGE_EVENT", {
      payload: { [key]: value },
      updated,
      key: settingKey,
    })
  }

  const clearSettings = () => {
    setSettings(createDefaultSettings())
  }

  const useSettingValue = () => {
    const value = useSettingValueRaw()
    return useMemo(() => sanitizeSettingsSnapshot(value), [value])
  }

  const getSettings = () => {
    return sanitizeSettingsSnapshot(getSettingsRaw())
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
