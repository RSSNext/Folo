import { getDeviceTypeAsync } from "expo-device"

import { appAtoms } from "../atoms/app"
import { jotaiStore } from "../lib/jotai"

export async function initDeviceType() {
  const type = await getDeviceTypeAsync()
  jotaiStore.set(appAtoms.deviceType, type)
}
