import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import type { FC } from "react"

interface AIChatSendButtonProps {
  onClick: () => void
  disabled?: boolean
  isProcessing?: boolean
  className?: string
  size?: "sm" | "md"
}

export const AIChatSendButton: FC<AIChatSendButtonProps> = ({
  onClick,
  disabled = false,
  isProcessing = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      buttonClassName={cn(
        "size-8 rounded-xl p-0 transition-all duration-300 active:scale-95",
        isProcessing
          ? "bg-red-500/90 hover:bg-red-500 shadow-lg shadow-red-500/25 backdrop-blur-sm"
          : disabled
            ? "bg-gray-200/80 cursor-not-allowed backdrop-blur-sm"
            : "bg-gradient-to-r from-accent to-accent/90 hover:from-accent hover:to-accent/90 shadow-lg shadow-accent/25 backdrop-blur-sm hover:shadow-accent/35",
        className,
      )}
    >
      {isProcessing ? (
        <i className="i-mgc-stop-circle-cute-fi size-4 text-white" />
      ) : (
        <i className="i-mgc-send-plane-cute-fi size-4 text-white" />
      )}
    </Button>
  )
}
