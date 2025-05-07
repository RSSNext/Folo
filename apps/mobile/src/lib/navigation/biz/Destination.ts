import { DeviceType } from "expo-device"

import { getDeviceType } from "@/src/atoms/hooks/useDeviceType"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"

import { isIOS } from "../../platform"
import { Navigation } from "../Navigation"

class Destination {
  private navigation = Navigation.rootNavigation

  get isIpad() {
    return getDeviceType() === DeviceType.TABLET && isIOS
  }

  get presentControllerView() {
    return this.navigation.presentControllerView
  }

  get pushControllerView() {
    return this.navigation.pushControllerView
  }

  Login() {
    this.presentControllerView(LoginScreen, void 0, this.isIpad ? "formSheet" : "modal")
  }
}

export const destination = new Destination()
