import { deleteNotificationsToken, updateNotificationsToken } from "../../lib/user"
import type { IpcContext } from "../base"
import { IpcService } from "../base"

export class AuthService extends IpcService {
  constructor() {
    super("auth")
  }

  protected registerMethods(): void {
    this.registerMethod("sessionChanged", this.sessionChanged.bind(this))
    this.registerMethod("signOut", this.signOut.bind(this))
  }

  async sessionChanged(_context: IpcContext): Promise<void> {
    await updateNotificationsToken()
  }

  async signOut(_context: IpcContext): Promise<void> {
    await deleteNotificationsToken()
  }
}
