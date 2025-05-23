import { Focusable as FocusableComponent } from "@follow/components/common/Focusable/Focusable.js"

import { FloatingLayerScope, HotkeyScope } from "~/constants"

interface BizFocusableProps extends Omit<React.ComponentType<typeof FocusableComponent>, "scope"> {
  scope: HotkeyScope
}
export const Focusable = FocusableComponent as Component<
  Prettify<BizFocusableProps> &
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>

export const FocusablePresets = {
  isNotFloatingLayerScope: (v: Set<string>) => !FloatingLayerScope.some((s) => v.has(s)),
  isSubscriptionList: (scope: Set<string>) => {
    return scope.size === 0 || scope.has(HotkeyScope.SubscriptionList)
  },

  isSubscriptionOrTimeline: (v: Set<string>) => {
    return v.has(HotkeyScope.SubscriptionList) || v.has(HotkeyScope.Timeline) || v.size === 0
  },
}
