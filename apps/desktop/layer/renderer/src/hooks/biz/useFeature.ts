import { useDebugFeatureValue } from "~/atoms/debug-feature"
import { useServerConfigs } from "~/atoms/server-configs"
import { featureConfigMap } from "~/lib/features"

export const useFeature = (feature: keyof typeof featureConfigMap) => {
  const debugFeatureValue = useDebugFeatureValue()
  const serverConfigs = useServerConfigs()
  const isEnabled =
    (featureConfigMap[feature] && serverConfigs?.[featureConfigMap[feature]]) ||
    debugFeatureValue[feature]
  return isEnabled
}
