import { getDebugFeatureValue, useDebugFeatureValue } from "~/atoms/debug-feature"
import { getServerConfigs, useServerConfigs } from "~/atoms/server-configs"
import { featureConfigMap } from "~/lib/features"

// Define debug feature value structure
interface DebugFeatureValue {
  __override?: boolean
  [key: string]: boolean | undefined
}

// Define feature key type
export type FeatureKey = keyof typeof featureConfigMap

/**
 * Core feature checking logic to avoid code duplication
 * @param feature - Feature key name
 * @param debugFeatureValue - Debug feature values
 * @param serverConfigs - Server configuration
 * @returns Whether the feature is enabled
 */
const checkFeatureEnabled = (
  feature: FeatureKey,
  debugFeatureValue: DebugFeatureValue,
  serverConfigs: ReturnType<typeof getServerConfigs>,
): boolean => {
  const override = !!debugFeatureValue.__override

  if (override) {
    return !!debugFeatureValue[feature]
  }

  const serverConfigKey = featureConfigMap[feature]
  return !!(serverConfigKey && serverConfigs?.[serverConfigKey])
}

/**
 * React Hook: Check if a specific feature is enabled
 * @param feature - Feature key name
 * @returns Whether the feature is enabled
 */
export const useFeature = (feature: FeatureKey): boolean => {
  const debugFeatureValue = useDebugFeatureValue() as DebugFeatureValue
  const serverConfigs = useServerConfigs()

  return checkFeatureEnabled(feature, debugFeatureValue, serverConfigs)
}

/**
 * Non-Hook function: Check if a specific feature is enabled
 * @param feature - Feature key name
 * @returns Whether the feature is enabled
 */
export const getFeature = (feature: FeatureKey): boolean => {
  const debugFeatureValue = getDebugFeatureValue() as DebugFeatureValue
  const serverConfigs = getServerConfigs()

  return checkFeatureEnabled(feature, debugFeatureValue, serverConfigs)
}
