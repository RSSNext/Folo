import { jotaiStore } from "@follow/utils"
import { useAtomValueRawSync } from "jotai"

import { appAtoms } from "../app"

export const useDeviceType = () => {
  // Set by an async init that can land while the first screens mount
  const deviceType = useAtomValueRawSync(appAtoms.deviceType)
  return deviceType
}

export const getDeviceType = () => {
  return jotaiStore.get(appAtoms.deviceType)
}
