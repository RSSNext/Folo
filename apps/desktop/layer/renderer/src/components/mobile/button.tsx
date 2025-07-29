import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"

export const HeaderTopReturnBackButton: Component<{ to?: string }> = ({ className, to }) => (
  <MotionButtonBase
    onClick={() => window.history.returnBack(to)}
    className={cn("center size-8", className)}
  >
    <i className="i-mingcute-left-line size-6" />

    <span className="sr-only">Back</span>
  </MotionButtonBase>
)
