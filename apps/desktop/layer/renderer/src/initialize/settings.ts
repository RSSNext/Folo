import { initializeDefaultAISettings } from "~/atoms/settings/ai"
import { initializeDefaultGeneralSettings } from "~/atoms/settings/general"
import { initializeDefaultIntegrationSettings } from "~/atoms/settings/integration"
import { initializeDefaultUISettings } from "~/atoms/settings/ui"

export const initializeSettings = () => {
  initializeDefaultUISettings()
  initializeDefaultGeneralSettings()
  initializeDefaultIntegrationSettings()
  initializeDefaultAISettings()
}
