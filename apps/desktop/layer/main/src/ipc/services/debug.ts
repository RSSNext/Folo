import { getIpcContext, IpcMethod, IpcService } from "electron-ipc-decorator"

interface InspectElementInput {
  x: number
  y: number
}

export class DebugService extends IpcService {
  static override readonly groupName = "debug"

  @IpcMethod()
  inspectElement(input: InspectElementInput): void {
    getIpcContext().sender.inspectElement(input.x, input.y)
  }
}
