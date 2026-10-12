import { requireNativeModule } from "expo"
import { Platform } from "react-native"

import { ToastManager } from "../components/ui/toast/manager"
import type { ToastProps } from "../components/ui/toast/types"

export const toastInstance = new ToastManager()

type CommandToastOptions = Partial<
  Pick<ToastProps, "duration" | "icon" | "render" | "message" | "description" | "position">
>
type Toast = {
  // [key in "error" | "success" | "info"]: (message: string) => void;
  show: typeof toastInstance.show
  error: (message: string, options?: CommandToastOptions) => void
  success: (message: string, options?: CommandToastOptions) => void
  info: (message: string, options?: CommandToastOptions) => void
}

interface NativeToasterOptions {
  title: string
  message: string
  type: "error" | "success" | "info" | "warn"
  /**
   * seconds
   */
  duration?: number
  position?: "top" | "center" | "bottom"
}
// A second line takes longer to read than the default short toast allows
const DEFAULT_DURATION = 1500
const DESCRIBED_DURATION = 5000

export const toast = {
  show: toastInstance.show.bind(toastInstance),
} as Toast
;(["error", "success", "info"] as const).forEach((type) => {
  toast[type] = (message: string, options: CommandToastOptions = {}) => {
    const duration =
      options.duration ?? (options.description ? DESCRIBED_DURATION : DEFAULT_DURATION)
    if (Platform.OS === "ios") {
      const NativeToaster = requireNativeModule("Toaster")
      NativeToaster.toast({
        // The native toast shows the title in bold above the message
        ...(options.description ? { title: message, message: options.description } : { message }),
        type,
        duration: duration / 1000,
        position: options.position,
      } as NativeToasterOptions)
      return
    }

    toastInstance.show({
      type,
      message,
      variant: "center-replace",
      ...options,
      duration,
    })
  }
})
