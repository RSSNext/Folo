import { appRoute } from "./app"
import { authRoute } from "./auth"
import { debugRoute } from "./debug"
import { dockRoute } from "./dock"
import { menuRoute } from "./menu"
import { readerRoute } from "./reader"
import { settingRoute } from "./setting"

export const router = {
  ...debugRoute,
  ...menuRoute,
  ...settingRoute,
  ...appRoute,
  ...dockRoute,
  ...readerRoute,
  ...authRoute,
}

export type Router = typeof router
