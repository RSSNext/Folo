import { ga4 } from "~/lib/ga4"
import { logger } from "~/logger"
import { WindowManager } from "~/manager/window"

import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

export class GA4Service extends IpcService {
  constructor() {
    super("ga4")
  }

  @IpcMethod()
  async logEvent(
    _context: IpcContext,
    input: {
      name: string
      params: Record<string, any>
    },
  ) {
    logger.info(`ga4 logEvent: ${input.name}`)
    const window = WindowManager.getMainWindow()
    const userAgent = window?.webContents.getUserAgent()
    await ga4?.logEvent(input.name, input.params, userAgent)
  }

  @IpcMethod()
  async setUserId(_context: IpcContext, input: { id: string }) {
    await ga4?.setUserId(input.id)
  }

  @IpcMethod()
  async setUserProperties(_context: IpcContext, input: { properties: Record<string, any> }) {
    await ga4?.setUserProperties(input.properties)
  }
}
