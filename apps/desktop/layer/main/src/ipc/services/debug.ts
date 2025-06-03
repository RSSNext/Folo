import type { IpcContext } from "../base"
import { IpcService } from "../base"

interface InspectElementInput {
  x: number
  y: number
}

export class DebugService extends IpcService {
  constructor() {
    super("debug")
  }

  protected registerMethods(): void {
    this.registerMethod("inspectElement", this.inspectElement.bind(this))
  }

  inspectElement(context: IpcContext, input: InspectElementInput): void {
    context.sender.inspectElement(input.x, input.y)
  }
}
