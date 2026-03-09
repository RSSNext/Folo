import Constants from "expo-constants"

interface AppExtra {
  e2eEnvProfile?: string | null
  e2eLanguage?: string | null
}

const getAppExtra = (): AppExtra => (Constants.expoConfig?.extra ?? {}) as AppExtra

export const getE2EEnvProfile = () =>
  getAppExtra().e2eEnvProfile ?? process.env.EXPO_PUBLIC_E2E_ENV_PROFILE ?? null

export const getE2ELanguage = () =>
  getAppExtra().e2eLanguage ?? process.env.EXPO_PUBLIC_E2E_LANGUAGE ?? null

export const isE2EEnabled = () => Boolean(getE2EEnvProfile() || getE2ELanguage())
