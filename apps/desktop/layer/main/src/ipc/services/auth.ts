import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"

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
}
