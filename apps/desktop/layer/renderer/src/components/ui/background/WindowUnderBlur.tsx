import { SYSTEM_CAN_UNDER_BLUR_WINDOW } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import type * as React from "react"
import type { ComponentPropsWithoutRef, ElementType } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"

type Props<T extends ElementType = "div"> = {
  as?: T
  ref?: React.Ref<HTMLElement>
} & ComponentPropsWithoutRef<T>

const MacOSVibrancy = <T extends ElementType = "div">({ children, as, ...rest }: Props<T>) => {
  const Component = as || "div"
  return <Component {...rest}>{children}</Component>
}

const Noop = <T extends ElementType = "div">({ children, className, as, ...rest }: Props<T>) => {
  const Component = as || "div"
  return (
    <Component className={cn("bg-sidebar", className)} {...rest}>
      {children}
    </Component>
  )
}

export const WindowUnderBlur = SYSTEM_CAN_UNDER_BLUR_WINDOW
  ? <T extends ElementType = "div">(props: Props<T>) => {
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
