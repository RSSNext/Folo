// Export types for renderer to use
export type { IpcServices } from "./src/ipc"
export type { RendererHandlers } from "./src/renderer-handlers"

// Export services for potential main process use
export { services } from "./src/ipc"
