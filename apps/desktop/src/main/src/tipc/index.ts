import { appRoute } from "./app"
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
}

export type Router = typeof router
