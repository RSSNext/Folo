import { SYSTEM_CAN_UNDER_BLUR_WINDOW } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"

import { useUISettingKey } from "~/atoms/settings/ui"

type Props = Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>
const MacOSVibrancy: Props = ({ children, ...rest }) => <div {...rest}>{children}</div>

const Noop: Props = ({ children, className, ...rest }) => (
  <div className={cn("bg-sidebar", className)} {...rest}>
    {children}
  </div>
)

export const WindowUnderBlur: Props = SYSTEM_CAN_UNDER_BLUR_WINDOW
  ? (props) => {
      const opaqueSidebar = useUISettingKey("opaqueSidebar")
      if (opaqueSidebar) {
        return <Noop {...props} />
      }

      if (!window.electron) {
        return <Noop {...props} />
      }
      switch (window.electron.process.platform) {
        case "darwin": {
          return <MacOSVibrancy {...props} />
        }
        case "win32": {
          return <Noop {...props} />
        }
        default: {
          return <Noop {...props} />
        }
      }
    }
  : Noop
