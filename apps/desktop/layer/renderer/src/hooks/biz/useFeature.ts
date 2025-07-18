import { useServerConfigs } from "~/atoms/server-configs"
import { featureConfigMap } from "~/lib/features"

export const useFeature = (feature: keyof typeof featureConfigMap) => {
  const serverConfigs = useServerConfigs()
  const isEnabled = featureConfigMap[feature] && serverConfigs?.[featureConfigMap[feature]]
  return isEnabled
}
