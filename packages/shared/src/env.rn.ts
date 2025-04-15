/**
 * This env for apps/mobile
 */
import { DEFAULT_VALUES } from "@follow/shared/env.common"

const profile = "prod"

const envProfileMap = {
  prod: {
    API_URL: DEFAULT_VALUES.PROD.API_URL,
    WEB_URL: DEFAULT_VALUES.PROD.WEB_URL,
    INBOXES_EMAIL: DEFAULT_VALUES.PROD.INBOXES_EMAIL,
    OPENPANEL_CLIENT_ID: DEFAULT_VALUES.PROD.OPENPANEL_CLIENT_ID,
    OPENPANEL_API_URL: DEFAULT_VALUES.PROD.OPENPANEL_API_URL,
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
    OPENPANEL_CLIENT_ID: DEFAULT_VALUES.STAGING.OPENPANEL_CLIENT_ID,
    OPENPANEL_API_URL: DEFAULT_VALUES.STAGING.OPENPANEL_API_URL,
  },
}
export const getEnvProfiles__dangerously = () => envProfileMap
export type { envProfileMap }
/**
 * @description this env always use prod env, please use `proxyEnv` to access dynamic env
 */
export const env = {
  WEB_URL: envProfileMap[profile].WEB_URL,
  API_URL: envProfileMap[profile].API_URL,
  APP_CHECK_DEBUG_TOKEN: process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN,
  OPENPANEL_CLIENT_ID: envProfileMap[profile].OPENPANEL_CLIENT_ID,
  OPENPANEL_API_URL: envProfileMap[profile].OPENPANEL_API_URL,
}
