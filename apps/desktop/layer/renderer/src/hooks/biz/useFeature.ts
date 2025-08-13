import { useDebugFeatureValue } from "~/atoms/debug-feature"
import { useServerConfigs } from "~/atoms/server-configs"
import { featureConfigMap } from "~/lib/features"

export const useFeature = (feature: keyof typeof featureConfigMap) => {
  const debugFeatureValue = useDebugFeatureValue()
  const serverConfigs = useServerConfigs()
  const override = !!(debugFeatureValue as any).__override
  const isEnabled = override
    ? !!(debugFeatureValue as any)[feature]
    : !!(featureConfigMap[feature] && serverConfigs?.[featureConfigMap[feature]])
  return isEnabled
}
