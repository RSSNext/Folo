/**
 * This env for apps/mobile
 */
import { DEFAULT_VALUES } from "./env.common"

const profile = "prod"

const envProfileMap = {
  prod: {
    API_URL: DEFAULT_VALUES.PROD.API_URL,
    WEB_URL: DEFAULT_VALUES.PROD.WEB_URL,
    INBOXES_EMAIL: DEFAULT_VALUES.PROD.INBOXES_EMAIL,
    POSTHOG_KEY: DEFAULT_VALUES.PROD.POSTHOG_KEY,
    POSTHOG_HOST: DEFAULT_VALUES.PROD.POSTHOG_HOST,
  },
  dev: {
    API_URL: DEFAULT_VALUES.DEV.API_URL,
    WEB_URL: DEFAULT_VALUES.DEV.WEB_URL,
    INBOXES_EMAIL: DEFAULT_VALUES.DEV.INBOXES_EMAIL,
  },
  staging: {
    API_URL: DEFAULT_VALUES.STAGING.API_URL,
    WEB_URL: DEFAULT_VALUES.STAGING.WEB_URL,
    INBOXES_EMAIL: DEFAULT_VALUES.STAGING.INBOXES_EMAIL,
    POSTHOG_KEY: DEFAULT_VALUES.STAGING.POSTHOG_KEY,
    POSTHOG_HOST: DEFAULT_VALUES.STAGING.POSTHOG_HOST,
  },
  local: {
    API_URL: DEFAULT_VALUES.LOCAL.API_URL,
    WEB_URL: DEFAULT_VALUES.LOCAL.WEB_URL,
    INBOXES_EMAIL: DEFAULT_VALUES.LOCAL.INBOXES_EMAIL,
  },
}
export const getEnvProfiles__dangerously = () => envProfileMap
export type { envProfileMap }
/**
 * @deprecated
 * @description this env always use prod env, please use `proxyEnv` to access dynamic env
 */
export const env = {
  WEB_URL: envProfileMap[profile].WEB_URL,
  API_URL: envProfileMap[profile].API_URL,
  APP_CHECK_DEBUG_TOKEN: process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN,
  POSTHOG_KEY: envProfileMap[profile].POSTHOG_KEY,
  POSTHOG_HOST: envProfileMap[profile].POSTHOG_HOST,
}
