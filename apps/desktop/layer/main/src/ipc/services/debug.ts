import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

interface InspectElementInput {
  x: number
  y: number
}

export class DebugService extends IpcService {
  static override readonly groupName = "debug"

  @IpcMethod()
  inspectElement(context: IpcContext, input: InspectElementInput): void {
    context.sender.inspectElement(input.x, input.y)
  }
}
