import { initI18n } from "@client/i18n"
import { initializeDayjs } from "@follow/components/dayjs"

import { initSentry } from "./sentry"

export const initialize = async () => {
  initializeDayjs()
  await Promise.all([initI18n(), initSentry()])
}
