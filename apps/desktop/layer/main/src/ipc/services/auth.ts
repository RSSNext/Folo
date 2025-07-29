import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

export class AuthService extends IpcService {
  constructor() {
    super("auth")
  }

  @IpcMethod()
  async sessionChanged(_context: IpcContext): Promise<void> {
    await updateNotificationsToken()
  }

  @IpcMethod()
  async signOut(_context: IpcContext): Promise<void> {
    await deleteNotificationsToken()
  }
}
