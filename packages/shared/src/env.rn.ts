/**
 * This env for apps/mobile
 */
const profile = "prod"

const envProfileMap = {
  prod: {
    API_URL: "https://api.follow.is",
    WEB_URL: "https://app.follow.is",
    INBOXES_EMAIL: "@follow.re",
    OPENPANEL_CLIENT_ID: "4382168f-b8d2-40c1-9a26-133a312d072b",
    OPENPANEL_API_URL: "https://openpanel.follow.is/api",
  },
  dev: {
    API_URL: "https://api.dev.follow.is",
    WEB_URL: "https://dev.follow.is",
    INBOXES_EMAIL: "__dev@follow.re",
  },
  staging: {
    API_URL: "https://api.follow.is",
    WEB_URL: "https://staging.follow.is",
    INBOXES_EMAIL: "@follow.re",
    OPENPANEL_CLIENT_ID: "4382168f-b8d2-40c1-9a26-133a312d072b",
    OPENPANEL_API_URL: "https://openpanel.follow.is/api",
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
