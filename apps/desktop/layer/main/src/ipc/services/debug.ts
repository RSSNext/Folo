import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

interface InspectElementInput {
  x: number
  y: number
}

export class DebugService extends IpcService {
  constructor() {
    super("debug")
  }

  @IpcMethod()
  inspectElement(context: IpcContext, input: InspectElementInput): void {
    context.sender.inspectElement(input.x, input.y)
  }
}
