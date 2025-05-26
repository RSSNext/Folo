/**
 * This env for apps/desktop
 */
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

import { DEFAULT_VALUES } from "./env.common"

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_WEB_URL: z.string().url().default(DEFAULT_VALUES.PROD.WEB_URL),
    VITE_API_URL: z.string().default(DEFAULT_VALUES.PROD.API_URL),
    VITE_DEV_PROXY: z.string().optional(),
    VITE_SENTRY_DSN: z.string().optional(),
    VITE_INBOXES_EMAIL: z.string().default(DEFAULT_VALUES.PROD.INBOXES_EMAIL),
    VITE_FIREBASE_CONFIG: z.string().optional(),

    VITE_OPENPANEL_CLIENT_ID: z.string().optional(),
    VITE_OPENPANEL_API_URL: z.string().url().optional(),

    VITE_HCAPTCHA_SITE_KEY: z.string().default(DEFAULT_VALUES.PROD.HCAPTCHA_SITE_KEY),
  },

  emptyStringAsUndefined: true,
  runtimeEnv: getRuntimeEnv() as any,

  skipValidation: "process" in globalThis ? process.env.VITEST === "true" : false,
})

function metaEnvIsEmpty() {
  try {
    return Object.keys(import.meta.env || {}).length === 0
  } catch {
    return true
  }
}

function getRuntimeEnv() {
  try {
    if (metaEnvIsEmpty()) {
      return process.env
    }
    return injectExternalEnv(import.meta.env)
  } catch {
    return process.env
  }
}

declare const globalThis: any
function injectExternalEnv<T>(originEnv: T): T {
  if (!("document" in globalThis)) {
    return originEnv
  }
  const prefix = "__followEnv"
  const env = globalThis[prefix]
  if (!env) {
    return originEnv
  }

  for (const key in env) {
    originEnv[key as keyof T] = env[key]
  }
  return originEnv
}
