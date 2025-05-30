import type { env, envProfileMap } from "@follow/shared/env.rn"
import { getEnvProfiles__dangerously } from "@follow/shared/env.rn"
import { createAtomHooks } from "@follow/utils"
import { reloadAppAsync } from "expo"
import { atomWithStorage } from "jotai/utils"

import { JotaiPersistSyncStorage } from "./jotai"

const [, , useEnvProfile, , getEnvProfile, _setEnvProfile] = createAtomHooks(
  atomWithStorage(
    "##Follow-Current-Env-Profile",
    __DEV__ ? "dev" : "prod",
    JotaiPersistSyncStorage,
    {
      getOnInit: true,
    },
  ),
)
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
  const currentProfile = getEnvProfile()
  if (currentProfile === profile) return
  _setEnvProfile(profile)
  reloadAppAsync()
}
export { useEnvProfile }
