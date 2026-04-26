import {
  buildBetterAuthSessionTokenCookieHeader,
  getBetterAuthSessionTokenCookieName,
} from "@follow/shared/auth-cookie"
import { env } from "@follow/shared/env.desktop"
import { createAuthRequestOriginHeaders, createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import {
  buildManagedAuthCookieHeader,
  buildManagedAuthCookieHeaderFromSetCookieHeader,
  dedupeManagedAuthCookies,
  getManagedAuthCookies,
  persistManagedAuthCookiesFromSetCookieHeader,
  removeManagedAuthCookies,
} from "../../lib/auth-cookies"
import { getCliSessionToken, syncSessionToCliConfig } from "../../lib/cli-session-sync"
import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import { logger } from "../../logger"

export class AuthService extends IpcService {
  static override readonly groupName = "auth"

  private pendingTwoFactorCookieHeader: string | null = null

  private getAuthRequestHeaders(additionalHeaders?: Record<string, string>) {
    return {
      ...createDesktopAPIHeaders({ version: PKG.version }),
      ...createAuthRequestOriginHeaders(env.VITE_WEB_URL),
      ...additionalHeaders,
    }
  }

  private async applySessionToken(token: string): Promise<void> {
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow || !token) {
      return
    }

    const apiURL = env.VITE_API_URL
    const url = new URL(apiURL)
    const isSecure =
      url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
    const cookieName = getBetterAuthSessionTokenCookieName(apiURL)
    const cookieSession = mainWindow.webContents.session

    await removeManagedAuthCookies({
      apiURL,
      session: cookieSession,
      names: [BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN, "__Secure-better-auth.session_token"],
    })
    await cookieSession.cookies.set({
      url: apiURL,
      name: cookieName,
      value: token,
      path: "/",
      httpOnly: true,
      secure: isSecure,
      sameSite: "no_restriction",
      expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    })
    await dedupeManagedAuthCookies({ apiURL, session: cookieSession })
  }

  private async clearSessionToken(): Promise<void> {
    this.pendingTwoFactorCookieHeader = null
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow) {
      return
    }

    const { session } = mainWindow.webContents
    const apiURL = env.VITE_API_URL
    await removeManagedAuthCookies({ apiURL, session })
  }

  private async requestCredentialAuth(
    path: "/sign-in/email" | "/sign-up/email",
    payload: Record<string, unknown>,
    headers?: Record<string, string>,
  ) {
    const response = await fetch(`${env.VITE_API_URL}/better-auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.getAuthRequestHeaders(headers),
      },
      body: JSON.stringify(payload),
    })

    const data = (await response
      .json()
      .catch(async () => ({ message: await response.text() }))) as Record<string, unknown>

    const setCookieValues =
      typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : []
    const setCookie =
      setCookieValues.length > 0
        ? setCookieValues.join(", ")
        : response.headers.get("set-cookie") || ""
    const mainWindow = WindowManager.getMainWindow()
    if (response.ok && setCookie && mainWindow) {
      await persistManagedAuthCookiesFromSetCookieHeader({
        apiURL: env.VITE_API_URL,
        session: mainWindow.webContents.session,
        setCookieHeader: setCookie,
      })
    }

    const pendingTwoFactorCookieHeader = buildManagedAuthCookieHeaderFromSetCookieHeader(setCookie)
    this.pendingTwoFactorCookieHeader =
      response.ok && typeof data.twoFactorRedirect === "boolean" && data.twoFactorRedirect
        ? pendingTwoFactorCookieHeader || null
        : null

    const sessionCookieMatch = setCookie.match(/better-auth\.session_token=([^;]+)/)
    const sessionToken = sessionCookieMatch?.[1] ?? null
    const token = typeof data.token === "string" ? data.token : null
    const persistedSessionToken = sessionToken ?? token
    if (response.ok && persistedSessionToken && !setCookie && mainWindow) {
      await this.applySessionToken(persistedSessionToken)
    }

    if (sessionToken) {
      data.sessionToken = sessionToken
    }

    return {
      data,
      error: response.ok
        ? null
        : {
            message: typeof data.message === "string" ? data.message : response.statusText,
            status: response.status,
          },
    }
  }

  @IpcMethod()
  async sessionChanged(_context: IpcContext, preferredToken?: string): Promise<void> {
    await updateNotificationsToken()

    // Sync the current desktop session to the npm CLI login.
    const token = await getCliSessionToken({
      preferredToken,
    })
    await syncSessionToCliConfig(token).catch((err) => {
      logger.error("Failed to sync session to CLI config:", err)
    })
  }

  @IpcMethod()
  async signOut(_context: IpcContext): Promise<void> {
    await deleteNotificationsToken()

    // Clear the synced CLI login on sign out.
    await syncSessionToCliConfig().catch((err) => {
      logger.error("Failed to clear CLI config token:", err)
    })
  }

  @IpcMethod()
  async signOutRemote(_context: IpcContext, token?: string): Promise<void> {
    await fetch(`${env.VITE_API_URL}/better-auth/sign-out`, {
      method: "POST",
      headers: this.getAuthRequestHeaders(
        token
          ? {
              Cookie: buildBetterAuthSessionTokenCookieHeader(env.VITE_API_URL, token),
            }
          : undefined,
      ),
    }).catch(() => {})

    await this.clearSessionToken()
  }

  @IpcMethod()
  async verifyTotp(
    _context: IpcContext,
    payload: { code: string; trustDevice?: boolean; headers?: Record<string, string> },
  ) {
    const mainWindow = WindowManager.getMainWindow()
    const cookieHeader =
      this.pendingTwoFactorCookieHeader ||
      (mainWindow
        ? buildManagedAuthCookieHeader(
            await getManagedAuthCookies({
              apiURL: env.VITE_API_URL,
              session: mainWindow.webContents.session,
            }),
          )
        : "")

    const response = await fetch(`${env.VITE_API_URL}/better-auth/two-factor/verify-totp`, {
      method: "POST",
      headers: this.getAuthRequestHeaders({
        "content-type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...payload.headers,
      }),
      body: JSON.stringify({
        code: payload.code,
        ...(payload.trustDevice !== undefined ? { trustDevice: payload.trustDevice } : {}),
      }),
    })

    const data = (await response
      .json()
      .catch(async () => ({ message: await response.text() }))) as Record<string, unknown>
    const setCookie =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie().join(", ")
        : response.headers.get("set-cookie") || ""
    if (response.ok && setCookie && mainWindow) {
      await persistManagedAuthCookiesFromSetCookieHeader({
        apiURL: env.VITE_API_URL,
        session: mainWindow.webContents.session,
        setCookieHeader: setCookie,
      })
    }

    const sessionCookieMatch = setCookie.match(/better-auth\.session_token=([^;]+)/)
    const sessionTokenFromCookie = sessionCookieMatch?.[1] ?? null
    const sessionTokenFromBody =
      data.session && typeof data.session === "object" && "token" in data.session
        ? (data.session as { token?: unknown }).token
        : null
    const sessionToken =
      typeof sessionTokenFromBody === "string" ? sessionTokenFromBody : sessionTokenFromCookie
    if (typeof sessionToken === "string") {
      data.sessionToken = sessionToken
    }

    if (response.ok) {
      this.pendingTwoFactorCookieHeader = null
    }

    return {
      data,
      error: response.ok
        ? null
        : {
            message: typeof data.message === "string" ? data.message : response.statusText,
            status: response.status,
          },
    }
  }

  @IpcMethod()
  async signInWithCredential(
    _context: IpcContext,
    payload: { email: string; password: string; headers?: Record<string, string> },
  ) {
    return this.requestCredentialAuth(
      "/sign-in/email",
      {
        email: payload.email,
        password: payload.password,
      },
      payload.headers,
    )
  }

  @IpcMethod()
  async signUpWithCredential(
    _context: IpcContext,
    payload: {
      email: string
      password: string
      name: string
      callbackURL: string
      headers?: Record<string, string>
    },
  ) {
    return this.requestCredentialAuth(
      "/sign-up/email",
      {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        callbackURL: payload.callbackURL,
      },
      payload.headers,
    )
  }

  @IpcMethod()
  async setSessionToken(_context: IpcContext, token: string): Promise<void> {
    await this.applySessionToken(token)
  }
}
