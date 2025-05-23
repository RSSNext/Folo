import { Focusable as FocusableComponent } from "@follow/components/common/Focusable/Focusable.js"

import type { HotkeyScope } from "~/constants"

interface BizFocusableProps extends Omit<React.ComponentType<typeof FocusableComponent>, "scope"> {
  scope: HotkeyScope
}
export const Focusable = FocusableComponent as Component<
  Prettify<BizFocusableProps> &
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>
