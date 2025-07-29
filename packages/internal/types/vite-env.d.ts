/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_WEB_URL: string
  VITE_API_URL: string
  VITE_SENTRY_DSN: string
  VITE_OPENPANEL_CLIENT_ID: string
  VITE_OPENPANEL_API_URL: string
  VITE_FIREBASE_CONFIG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
