export interface ToastProps {
  currentIndex: number
  variant: "bottom-stack" | "center-replace"
  type: "success" | "error" | "info"
  message: string
  /** A second line under the message, such as the reason a request failed */
  description?: string
  render: React.ReactNode

  action: {
    label: React.ReactNode
    onPress: () => void
    variant?: "normal" | "destructive"
  }[]
  duration: number
  icon?: React.ReactNode | false
  canClose?: boolean

  position?: "top" | "center" | "bottom"
}

export type CenterToastProps = Partial<
  Pick<ToastProps, "message" | "description" | "render" | "type" | "duration" | "icon">
> & {
  variant: "center-replace"
}

export type BottomToastProps = Partial<ToastProps> & {
  variant: "bottom-stack"
  canClose?: boolean
}

export interface ToastRef {
  dismiss: () => Promise<void>
}
