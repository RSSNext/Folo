import { UserRole } from "@follow/constants"
import { useRefValue } from "@follow/hooks"
import { getSettingPaidLevel, SettingPaidLevels } from "@follow/shared/settings/constants"
import { useUserStore } from "@follow/store/user/store"
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
type Role = UserRole | null

/**
 * Whether a role can use a setting of this paid level, as on desktop. Only a role known to lack
 * the plan locks it: the role loads after the app renders and is unknown while signed out, and
 * the saved values keep working meanwhile.
 */
const canUsePaidLevel = (requiredLevel: SettingPaidLevels | undefined, role: Role) =>
  requiredLevel === undefined ||
  requiredLevel === SettingPaidLevels.Free ||
  requiredLevel === SettingPaidLevels.FreeLimited ||
  (role !== UserRole.Free && role !== UserRole.Trial)

const roleSelector = (state: { role: Role }) => state.role
// Re-renders the setting hooks when the role changes, as the values they read depend on it
const useRole = () => useUserStore(roleSelector)
const getRole = () => useUserStore.getState().role

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

  const [, , useSettingValueRaw, , getSettingsRaw, setSettings] = createAtomHooks(atom)

  const defaults = createDefaultSettings() as Record<string, unknown>
  // The defaults of the paid settings, which a plan without them reads
  const paidSettingDefaults = new Map(
    Object.keys(defaults)
      .filter((key) => getSettingPaidLevel(settingKey, key) !== undefined)
      .map((key) => [key, defaults[key]]),
  )

  const isLocked = (key: string, role: Role) =>
    paidSettingDefaults.has(key) && !canUsePaidLevel(getSettingPaidLevel(settingKey, key), role)

  /**
   * A paid setting the plan lacks reads as its default, as on desktop. The saved value is kept
   * and applies again once the plan includes the setting.
   */
  const resolveAccessibleValue = (key: string, value: unknown, role: Role) =>
    isLocked(key, role) ? paidSettingDefaults.get(key) : value

  const sanitizeSettings = (settings: T, role: Role): T => {
    const raw = settings as Record<string, unknown>
    let sanitized: Record<string, unknown> | null = null

    for (const key of paidSettingDefaults.keys()) {
      const value = resolveAccessibleValue(key, raw[key], role)
      if (value !== raw[key]) {
        if (!sanitized) sanitized = { ...raw }
        sanitized[key] = value
      }
    }

    return (sanitized ?? raw) as T
  }

  const initializeDefaultSettings = () => {
    const currentSettings = getSettingsRaw()
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

    const value = useAtomValue(selectedAtom) as ReturnType<typeof getSettings>[T]
    const role = useRole()
    if (!key) return value
    return resolveAccessibleValue(String(key), value, role) as ReturnType<typeof getSettings>[T]
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
    const role = useRole()

    return useAtomValue(
      useMemo(
        () =>
          selectAtom(
            atom,
            (state) => stableSelector.current(sanitizeSettings(state, role) as S),
            shallow,
          ),
        [stableSelector, role],
      ),
    )
  }

  /** Whether the user's plan lacks this paid setting */
  const usePaidSettingLocked = (key: keyof ReturnType<typeof getSettings>) =>
    isLocked(String(key), useRole())

  /**
   * Saves a setting. While the plan lacks a paid setting, only its default is saved: the setting
   * can be turned off but not on.
   */
  const setSetting = <K extends keyof ReturnType<typeof getSettings>>(
    key: K,
    value: ReturnType<typeof getSettings>[K],
  ) => {
    if (isLocked(String(key), getRole()) && value !== paidSettingDefaults.get(String(key))) {
      return
    }
    const updated = Date.now()

    EventBus.dispatch("SETTING_CHANGE_EVENT", {
      key: settingKey as "general" | "ui" | "spotlight",
      payload: {
        [key]: value,
      },
    })
    setSettings({
      ...getSettingsRaw(),
      [key]: value,

      updated,
    })
  }

  const clearSettings = () => {
    setSettings(createDefaultSettings())
  }

  const useSettingValue = () => {
    const value = useSettingValueRaw()
    const role = useRole()
    return useMemo(() => sanitizeSettings(value, role), [value, role])
  }

  const getSettings = () => sanitizeSettings(getSettingsRaw(), getRole())

  Object.defineProperty(useSettingValue, "select", {
    value: useSettingSelector,
  })

  return {
    useSettingKey,
    useSettingSelector,
    usePaidSettingLocked,
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
    usePaidSettingLocked: typeof usePaidSettingLocked
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
