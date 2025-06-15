import { SYSTEM_CAN_UNDER_BLUR_WINDOW } from "@follow/shared/constants"
import type * as React from "react"
import type { ComponentPropsWithoutRef, ElementType } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"

import { MacOSVibrancy, Noop } from "./WindowUnderBlurUtils"

type Props<T extends ElementType = "div"> = {
  as?: T
  ref?: React.Ref<HTMLElement>
} & ComponentPropsWithoutRef<T>

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
