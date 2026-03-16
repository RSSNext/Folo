import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { getSessionTokenFromCookies, syncSessionToCliConfig } from "../../lib/cli-session-sync"
import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import { logger } from "../../logger"

export class AuthService extends IpcService {
  static override readonly groupName = "auth"

  private async applySessionToken(token: string): Promise<void> {
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow || !token) {
      return
    }

    const apiURL = env.VITE_API_URL
    const url = new URL(apiURL)
    const isSecure = url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1"
    const cookieNames = [
      BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN,
      ...(isSecure && !isLocalhost ? ["__Secure-better-auth.session_token"] : []),
    ]

    await Promise.all(
      cookieNames.map((name) =>
        mainWindow.webContents.session.cookies.set({
          url: apiURL,
          name,
          value: token,
          ...(isLocalhost ? {} : { domain: url.hostname }),
          path: "/",
          httpOnly: true,
          secure: isSecure,
          sameSite: "no_restriction",
          expirationDate: new Date().setDate(new Date().getDate() + 30),
        }),
      ),
    )
  }

  private async clearSessionToken(): Promise<void> {
    const mainWindow = WindowManager.getMainWindow()
    if (!mainWindow) {
      return
    }

    const { session } = mainWindow.webContents
    const apiURL = env.VITE_API_URL
    await Promise.allSettled([
      session.cookies.remove(apiURL, BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN),
      session.cookies.remove(apiURL, "__Secure-better-auth.session_token"),
      session.cookies.remove(apiURL, "better-auth.last_used_login_method"),
    ])
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
        ...createDesktopAPIHeaders({ version: PKG.version }),
        ...headers,
      },
      body: JSON.stringify(payload),
    })

    const data = (await response
      .json()
      .catch(async () => ({ message: await response.text() }))) as Record<string, unknown>

    const setCookie = response.headers.get("set-cookie") || ""
    const sessionCookieMatch = setCookie.match(/better-auth\.session_token=([^;]+)/)
    const sessionToken = sessionCookieMatch?.[1] ?? null
    const token = typeof data.token === "string" ? data.token : null
    const persistedSessionToken = sessionToken ?? token
    if (response.ok && persistedSessionToken) {
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
  async sessionChanged(_context: IpcContext): Promise<void> {
    await updateNotificationsToken()

    // Sync session token to CLI config
    const token = await getSessionTokenFromCookies()
    await syncSessionToCliConfig(token).catch((err) => {
      logger.error("Failed to sync session to CLI config:", err)
    })
  }

  @IpcMethod()
  async signOut(_context: IpcContext): Promise<void> {
    await deleteNotificationsToken()

    // Clear CLI config token on sign out
    await syncSessionToCliConfig().catch((err) => {
      logger.error("Failed to clear CLI config token:", err)
    })
  }

  @IpcMethod()
  async signOutRemote(_context: IpcContext, token?: string): Promise<void> {
    await fetch(`${env.VITE_API_URL}/better-auth/sign-out`, {
      method: "POST",
      headers: {
        ...createDesktopAPIHeaders({ version: PKG.version }),
        ...(token
          ? {
              Cookie: `__Secure-better-auth.session_token=${token}; better-auth.session_token=${token}`,
            }
          : {}),
      },
    }).catch(() => {})

    await this.clearSessionToken()
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
