import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { app } from "electron"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"
import path from "pathe"

import { isMAS } from "../../env"
import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import { logger } from "../../logger"

const execFileAsync = promisify(execFile)

export interface NativeAppleAuthResult {
  success: boolean
  data?: {
    identityToken: string
    authorizationCode: string
    user: string
    email?: string
    fullName?: {
      givenName?: string
      familyName?: string
    }
  }
  error?: string
}

export class AuthService extends IpcService {
  static override readonly groupName = "auth"

  @IpcMethod()
  async sessionChanged(_context: IpcContext): Promise<void> {
    await updateNotificationsToken()
  }

  @IpcMethod()
  async signOut(_context: IpcContext): Promise<void> {
    await deleteNotificationsToken()
  }

  /**
   * Performs native Sign in with Apple using the macOS AuthenticationServices framework.
   * This is only available on Mac App Store (MAS) builds.
   * Returns the Apple ID credential including the identity token for server-side verification.
   */
  @IpcMethod()
  async signInWithApple(_context: IpcContext): Promise<NativeAppleAuthResult> {
    if (!isMAS) {
      return {
        success: false,
        error: "Native Sign in with Apple is only available on Mac App Store builds",
      }
    }

    try {
      const __dirname = fileURLToPath(new URL(".", import.meta.url))
      // In production, the helper is in the Resources directory
      // In development, we need to find it relative to the source
      // Path from: apps/desktop/layer/main/src/ipc/services/
      // To:        apps/desktop/resources/apple-auth-helper/
      // The helper is packaged as an .app bundle to have a proper Bundle ID for Sign in with Apple
      const helperPath = app.isPackaged
        ? path.join(
            process.resourcesPath,
            "apple-auth-helper",
            "AppleAuthHelper.app",
            "Contents",
            "MacOS",
            "AppleAuthHelper",
          )
        : path.resolve(
            __dirname,
            "../../../../../resources/apple-auth-helper/AppleAuthHelper.app/Contents/MacOS/AppleAuthHelper",
          )

      logger.info("Executing AppleAuthHelper", { helperPath })

      const { stdout, stderr } = await execFileAsync(helperPath, [], {
        timeout: 120000, // 2 minutes timeout for user interaction
      })

      if (stderr) {
        logger.warn("AppleAuthHelper stderr", { stderr })
      }

      const result = JSON.parse(stdout) as NativeAppleAuthResult
      logger.info("AppleAuthHelper result", { success: result.success, hasData: !!result.data })

      return result
    } catch (error) {
      logger.error("Failed to execute AppleAuthHelper", { error })

      // When the helper exits with non-zero status, execFileAsync rejects
      // but the error object still contains stdout with the JSON result
      if (error && typeof error === "object" && "stdout" in error) {
        const { stdout } = error as { stdout?: string }
        if (stdout) {
          try {
            const result = JSON.parse(stdout) as NativeAppleAuthResult
            logger.info("AppleAuthHelper result from error.stdout", {
              success: result.success,
              error: result.error,
            })
            return result
          } catch {
            // Failed to parse stdout, fall through to generic error handling
          }
        }
      }

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: "Unknown error occurred during Sign in with Apple",
      }
    }
  }

  /**
   * Check if native Sign in with Apple is available.
   * This is only true on Mac App Store (MAS) builds.
   */
  @IpcMethod()
  isNativeAppleAuthAvailable(_context: IpcContext): boolean {
    return isMAS
  }
}
