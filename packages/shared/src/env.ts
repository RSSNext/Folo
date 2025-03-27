/**
 * This is universal env
 */
import { z } from "zod"

export const envSchema = {
  VITE_WEB_URL: z.string().url().default("https://app.follow.is"),
  VITE_API_URL: z.string().default("https://api.follow.is"),
  VITE_DEV_PROXY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_INBOXES_EMAIL: z.string().default("@follow.re"),
  VITE_FIREBASE_CONFIG: z.string().optional(),

  VITE_OPENPANEL_CLIENT_ID: z.string().optional(),
  VITE_OPENPANEL_API_URL: z.string().url().optional(),

  // For external, use api_url if you don't want to fill it in.
  VITE_EXTERNAL_PROD_API_URL: z.string().optional(),
  VITE_EXTERNAL_DEV_API_URL: z.string().optional(),
  VITE_EXTERNAL_API_URL: z.string().optional(),
  VITE_WEB_PROD_URL: z.string().optional(),
  VITE_WEB_DEV_URL: z.string().optional(),

  VITE_RECAPTCHA_V2_SITE_KEY: z.string().default("6LdxQ-sqAAAAAN-_za3hUdFkJEO_cu2xHSpLKVan"),
  VITE_RECAPTCHA_V3_SITE_KEY: z.string().default("6LdG-asqAAAAAEXr96565MKbRvxGEv31XEykRSHV"),
}

export const isDev = false
export const env = z.object(envSchema).parse(process.env || {})
