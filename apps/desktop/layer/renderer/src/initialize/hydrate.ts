import { initializeDefaultGeneralSettings } from "~/atoms/settings/general"
import { initializeDefaultIntegrationSettings } from "~/atoms/settings/integration"
import { initializeDefaultUISettings } from "~/atoms/settings/ui"

export const hydrateSettings = () => {
  initializeDefaultUISettings()
  initializeDefaultGeneralSettings()
  initializeDefaultIntegrationSettings()
}
