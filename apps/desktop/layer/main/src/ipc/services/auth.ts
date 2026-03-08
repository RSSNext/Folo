import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { getSessionTokenFromCookies, syncSessionToCliConfig } from "../../lib/cli-session-sync"
import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import { logger } from "../../logger"

export class AuthService extends IpcService {
  static override readonly groupName = "auth"

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
}
