import { getDeviceTypeAsync } from "expo-device"

import { appAtoms } from "../atoms/app"
import { jotaiStore } from "../lib/jotai"

export function initDeviceType() {
  getDeviceTypeAsync().then((type) => {
    jotaiStore.set(appAtoms.deviceType, type)
  })
}
