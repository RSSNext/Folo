import Constants from "expo-constants"

interface AppExtra {
  e2eEnvProfile?: unknown
  e2eLanguage?: unknown
}

const getAppExtra = (): AppExtra => (Constants.expoConfig?.extra ?? {}) as AppExtra

// The native app config turns the `null` defaults into `{}`, so only a non-empty string counts
const asSetting = (value: unknown) => (typeof value === "string" && value ? value : null)

export const getE2EEnvProfile = () =>
  asSetting(getAppExtra().e2eEnvProfile) ?? asSetting(process.env.EXPO_PUBLIC_E2E_ENV_PROFILE)

export const getE2ELanguage = () =>
  asSetting(getAppExtra().e2eLanguage) ?? asSetting(process.env.EXPO_PUBLIC_E2E_LANGUAGE)
