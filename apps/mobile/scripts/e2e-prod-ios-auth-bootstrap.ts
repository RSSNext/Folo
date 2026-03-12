import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import process from "node:process"

import { join } from "pathe"

type AuthError = {
  code?: number
  message?: string
  status?: number
  statusText?: string
}

type AuthResponse = {
  data: {
    token?: string | null
  } | null
  error: AuthError | null
}

type CookieValue = {
  expires: string | null
  value: string
}

type CookieMap = Record<string, CookieValue>

const DEFAULT_BUNDLE_ID = "is.follow"
const DEFAULT_PASSWORD = "Password123!"
const COOKIE_STORAGE_KEY = "follow_secure_store_fallback:follow_auth_cookie"
const SESSION_TOKEN_STORAGE_KEY = "follow_secure_store_fallback:__Secure-better-auth.session_token"
const SESSION_COOKIE_KEYS = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
] as const
const envProfileDefaults = {
  local: {
    apiUrl: "http://127.0.0.1:3000",
    callbackUrl: "http://localhost:2233/login",
  },
  prod: {
    apiUrl: "https://api.folo.is",
    callbackUrl: "https://app.folo.is/login",
  },
} as const

const getArgValue = (name: string) => {
  const index = process.argv.indexOf(name)
  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

const run = (command: string, args: string[]) =>
  execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()

const tryRun = (command: string, args: string[]) => {
  try {
    return run(command, args)
  } catch {
    return null
  }
}

const resolveBootedIOSDevice = () => {
  const output = tryRun("xcrun", ["simctl", "list", "devices", "booted"])
  if (!output) {
    return null
  }

  const match = output.match(/\(([A-F0-9-]{36})\) \(Booted\)/)
  return match?.[1] ?? null
}

const escapeSql = (value: string) => value.replaceAll("'", "''")

const splitSetCookieHeader = (header: string) => {
  const parts: string[] = []
  let buffer = ""
  let index = 0

  while (index < header.length) {
    const char = header[index]

    if (char === ",") {
      const recent = buffer.toLowerCase()
      const hasExpires = recent.includes("expires=")
      const hasGmt = /gmt/i.test(recent)

      if (hasExpires && !hasGmt) {
        buffer += char
        index += 1
        continue
      }

      if (buffer.trim()) {
        parts.push(buffer.trim())
        buffer = ""
      }

      index += 1
      if (header[index] === " ") {
        index += 1
      }
      continue
    }

    buffer += char
    index += 1
  }

  if (buffer.trim()) {
    parts.push(buffer.trim())
  }

  return parts
}

const toCookieMap = (setCookieHeader: string): CookieMap => {
  const cookies = splitSetCookieHeader(setCookieHeader)
  const now = Date.now()
  const cookieMap: CookieMap = {}

  for (const cookie of cookies) {
    const parts = cookie.split(";").map((part) => part.trim())
    const [nameValue, ...attributes] = parts
    if (!nameValue) {
      continue
    }

    const [name, ...valueParts] = nameValue.split("=")
    if (!name) {
      continue
    }

    const value = valueParts.join("=")
    let expires: string | null = null

    for (const attribute of attributes) {
      const [rawAttrName, ...rawAttrValueParts] = attribute.split("=")
      const attrName = rawAttrName?.toLowerCase()
      const attrValue = rawAttrValueParts.join("=")

      if (attrName === "max-age") {
        const maxAge = Number(attrValue)
        if (!Number.isNaN(maxAge)) {
          expires = new Date(now + maxAge * 1000).toISOString()
        }
      }

      if (!expires && attrName === "expires") {
        const parsed = new Date(attrValue)
        if (!Number.isNaN(parsed.getTime())) {
          expires = parsed.toISOString()
        }
      }
    }

    cookieMap[name] = {
      value,
      expires,
    }
  }

  return cookieMap
}

const parseJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text()
  if (!text) {
    return null
  }

  return JSON.parse(text) as T
}

const requestAuth = async ({
  apiUrl,
  body,
  clientId,
  path,
  sessionId,
}: {
  apiUrl: string
  body: Record<string, unknown>
  clientId: string
  path: string
  sessionId: string
}) => {
  const response = await fetch(new URL(path, apiUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-id": clientId,
      "x-session-id": sessionId,
      "x-token": "ac:fallback",
    },
    body: JSON.stringify(body),
  })

  const json = await parseJson<AuthResponse>(response)

  return {
    response,
    json,
    setCookie: response.headers.get("set-cookie"),
  }
}

const signIn = (input: {
  apiUrl: string
  clientId: string
  email: string
  password: string
  sessionId: string
}) =>
  requestAuth({
    apiUrl: input.apiUrl,
    path: "/better-auth/sign-in/email",
    clientId: input.clientId,
    sessionId: input.sessionId,
    body: {
      email: input.email,
      password: input.password,
      rememberMe: true,
    },
  })

const signUp = (input: {
  apiUrl: string
  callbackUrl: string
  clientId: string
  email: string
  password: string
  sessionId: string
}) =>
  requestAuth({
    apiUrl: input.apiUrl,
    path: "/better-auth/sign-up/email",
    clientId: input.clientId,
    sessionId: input.sessionId,
    body: {
      email: input.email,
      password: input.password,
      name: input.email.split("@")[0] ?? input.email,
      callbackURL: input.callbackUrl,
    },
  })

const assertAuthSuccess = ({
  action,
  response,
  result,
}: {
  action: string
  response: Response
  result: AuthResponse | null
}) => {
  if (response.ok && !result?.error) {
    return
  }

  const message =
    result?.error?.message || `${action} failed with ${response.status} ${response.statusText}`
  throw new Error(message)
}

const upsertStorageValue = (dbPath: string, key: string, value: string) => {
  const sql = `INSERT OR REPLACE INTO storage(key, value) VALUES('${escapeSql(key)}', '${escapeSql(value)}');`
  run("sqlite3", [dbPath, sql])
}

const main = async () => {
  const envProfile = process.env.EXPO_PUBLIC_E2E_ENV_PROFILE === "local" ? "local" : "prod"
  const envDefaults = envProfileDefaults[envProfile]
  const apiUrl = process.env.E2E_API_URL ?? envDefaults.apiUrl
  const bundleId = process.env.E2E_BUNDLE_ID ?? DEFAULT_BUNDLE_ID
  const callbackUrl = process.env.E2E_CALLBACK_URL ?? envDefaults.callbackUrl
  const email = process.env.E2E_EMAIL ?? `folo-self-test-ios-${envProfile}-${Date.now()}@gmail.com`
  const password = process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD
  const deviceId =
    getArgValue("--udid") ??
    process.env.MAESTRO_IOS_DEVICE_ID ??
    process.env.IOS_UDID ??
    resolveBootedIOSDevice()

  if (!deviceId) {
    throw new Error("Missing iOS simulator UDID. Pass --udid or set MAESTRO_IOS_DEVICE_ID.")
  }

  const clientId = process.env.E2E_CLIENT_ID ?? `codex-e2e-${Date.now()}`
  const sessionId = process.env.E2E_SESSION_ID ?? `codex-e2e-${Date.now()}`

  let signInResult = await signIn({
    apiUrl,
    clientId,
    email,
    password,
    sessionId,
  })

  if (!signInResult.response.ok || signInResult.json?.error || !signInResult.setCookie) {
    const signUpResult = await signUp({
      apiUrl,
      callbackUrl,
      clientId,
      email,
      password,
      sessionId,
    })

    if (!signUpResult.response.ok || signUpResult.json?.error) {
      const signInMessage = signInResult.json?.error?.message
      const signUpMessage = signUpResult.json?.error?.message
      const isExistingAccount = signUpMessage?.toLowerCase().includes("exist")

      if (!isExistingAccount) {
        throw new Error(
          signUpMessage || signInMessage || `sign up failed with ${signUpResult.response.status}`,
        )
      }
    }

    signInResult = await signIn({
      apiUrl,
      clientId,
      email,
      password,
      sessionId,
    })
  }

  assertAuthSuccess({
    action: "sign in",
    response: signInResult.response,
    result: signInResult.json,
  })

  if (!signInResult.setCookie) {
    throw new Error("Missing set-cookie header from sign in response.")
  }

  const cookieMap = toCookieMap(signInResult.setCookie)
  const sessionToken = SESSION_COOKIE_KEYS.map((key) => cookieMap[key]?.value).find(Boolean)
  if (!sessionToken) {
    throw new Error("Missing session cookie after sign in.")
  }

  const appContainer = run("xcrun", ["simctl", "get_app_container", deviceId, bundleId, "data"])
  const storageDbPath = join(appContainer, "Documents", "SQLite", "ExpoSQLiteStorage")

  if (!existsSync(storageDbPath)) {
    throw new Error(
      `ExpoSQLiteStorage not found at ${storageDbPath}. Install and launch the app first.`,
    )
  }

  upsertStorageValue(storageDbPath, COOKIE_STORAGE_KEY, JSON.stringify(cookieMap))
  upsertStorageValue(storageDbPath, SESSION_TOKEN_STORAGE_KEY, sessionToken)

  tryRun("xcrun", ["simctl", "terminate", deviceId, bundleId])

  run("xcrun", ["simctl", "launch", deviceId, bundleId])

  process.stdout.write(
    `${JSON.stringify(
      {
        apiUrl,
        bundleId,
        deviceId,
        email,
        password,
        storageDbPath,
      },
      null,
      2,
    )}\n`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
