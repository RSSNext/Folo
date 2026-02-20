import { getIsPaymentEnabled } from "@/src/atoms/server-configs"
import { Navigation } from "@/src/lib/navigation/Navigation"

export const navigateToPlanScreen = () => {
  if (!getIsPaymentEnabled()) {
    return Promise.resolve()
  }

  return import("./Plan")
    .then(({ PlanScreen }) => {
      Navigation.rootNavigation.pushControllerView(PlanScreen)
    })
    .catch((error) => {
      if (__DEV__) {
        console.error("Failed to open plan screen", error)
      }
      throw error
    })
}
