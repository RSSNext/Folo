import { useNavigation } from "expo-router"

export const useIsRouteOnlyOne = () => {
  const navigation = useNavigation()
  const state = navigation.getState()

  const routeOnlyOne = state?.routes.length === 1

  return routeOnlyOne
}
