import { jotaiStore } from "@follow/utils"
import { useAtomValue } from "jotai"

import { appAtoms } from "../app"

export const useDeviceType = () => {
  const deviceType = useAtomValue(appAtoms.deviceType)
  return deviceType
}

export const getDeviceType = () => {
  return jotaiStore.get(appAtoms.deviceType)
}
