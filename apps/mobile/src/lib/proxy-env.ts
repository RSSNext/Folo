import type { env, envProfileMap } from "@follow/shared/env.rn"
import { getEnvProfiles__dangerously } from "@follow/shared/env.rn"
import { createAtomHooks } from "@follow/utils"
import { reloadAppAsync } from "expo"
import { atomWithStorage } from "jotai/utils"
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage"

import { cookieKey } from "./auth"
import { getE2EEnvProfile } from "./e2e-config"
import { JotaiPersistSyncStorage } from "./jotai"
import { safeSecureStore } from "./secure-store"

const getForcedEnvProfile = (): keyof typeof envProfileMap | null => {
  const profile = getE2EEnvProfile()
  if (!profile) {
    return null
  }

  const envProfiles = getEnvProfiles__dangerously()
  return profile in envProfiles ? (profile as keyof typeof envProfileMap) : null
}

const [, , useStoredEnvProfile, , getStoredEnvProfile, _setEnvProfile] = createAtomHooks(
  atomWithStorage(
    "##Follow-Current-Env-Profile",
    __DEV__ ? "dev" : "prod",
    JotaiPersistSyncStorage as SyncStorage<string>,
    {
      getOnInit: true,
    },
  ),
)

const getEnvProfile = () =>
  getForcedEnvProfile() ?? (getStoredEnvProfile() as keyof typeof envProfileMap)

const useEnvProfile = () => {
  const storedProfile = useStoredEnvProfile() as keyof typeof envProfileMap
  return getForcedEnvProfile() ?? storedProfile
}

export const proxyEnv = new Proxy(
  {},
  {
    get(target, prop) {
      const profile = getEnvProfile() as keyof typeof envProfileMap
      const envProfiles = getEnvProfiles__dangerously()
      const envMap = envProfiles[profile]

      return envMap[prop as keyof typeof envMap]
    },
  },
) as any as typeof env

export const setEnvProfile = (profile: keyof typeof envProfileMap) => {
  if (getForcedEnvProfile()) return

  const currentProfile = getEnvProfile()
  if (currentProfile === profile) return
  _setEnvProfile(profile)
  try {
    const input = safeSecureStore.getItem(`${cookieKey}_${profile}`)
    if (input) {
      safeSecureStore.setItem(cookieKey, input)
    }
  } catch (e) {
    console.warn("SecureStore access failed during env profile switch:", e)
  }

  reloadAppAsync()
}
export { getEnvProfile, useEnvProfile }
