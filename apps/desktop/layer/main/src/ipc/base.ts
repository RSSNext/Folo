import type { IpcMainInvokeEvent, WebContents } from "electron"
import { ipcMain } from "electron"

// Base context for IPC methods
export interface IpcContext {
  sender: WebContents
  event: IpcMainInvokeEvent
}

// Handler registry for IPC methods
export class IpcHandler {
  private static instance: IpcHandler
  private registeredChannels = new Set<string>()

  static getInstance(): IpcHandler {
    if (!IpcHandler.instance) {
      IpcHandler.instance = new IpcHandler()
    }
    return IpcHandler.instance
  }

  registerMethod<TOutput>(
    channel: string,
    handler: (context: IpcContext, ...args: any[]) => Promise<TOutput> | TOutput,
  ) {
    if (this.registeredChannels.has(channel)) {
      return // Already registered
    }

    this.registeredChannels.add(channel)

    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
      const context: IpcContext = {
        sender: event.sender,
        event,
      }

      try {
        return await handler(context, ...args)
      } catch (error) {
        console.error(`Error in IPC method ${channel}:`, error)
        throw error
      }
    })
  }

  // Send events to renderer
  sendToRenderer<T = any>(webContents: WebContents, channel: string, data: T) {
    webContents.send(channel, data)
  }
}

// Base class for IPC service groups
export abstract class IpcService {
  protected handler = IpcHandler.getInstance()

  constructor(protected groupName: string) {
    this.registerMethods()
  }

  protected abstract registerMethods(): void

  protected registerMethod<TOutput>(
    methodName: string,
    handler: (context: IpcContext, ...args: any[]) => Promise<TOutput> | TOutput,
  ) {
    const channel = `${this.groupName}.${methodName}`
    this.handler.registerMethod(channel, handler)
  }

  // Helper method to send events to renderer
  protected sendToRenderer<T>(webContents: WebContents, event: string, data: T) {
    this.handler.sendToRenderer(webContents, `${this.groupName}.${event}`, data)
  }
}

// Extract method signatures from service class, removing context parameter
export type ExtractServiceMethods<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K] extends (
    context: IpcContext,
    ...args: infer Args
  ) => infer Output
    ? Args extends []
      ? () => Output
      : Args extends [infer Input]
        ? (input: Input) => Output
        : (...args: Args) => Output
    : never
}
