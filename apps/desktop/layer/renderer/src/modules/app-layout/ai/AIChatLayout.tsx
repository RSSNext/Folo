import type { FC } from "react"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"

import { AIChatFixedPanel } from "./AIChatFixedPanel"
import { AIChatFloatingPanel } from "./AIChatFloatingPanel"

export interface AIChatLayoutProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export const AIChatLayout: FC<AIChatLayoutProps> = ({ ...props }) => {
  const panelStyle = useAIChatPanelStyle()

  if (panelStyle === AIChatPanelStyle.Floating) {
    return <AIChatFloatingPanel {...props} />
  }
  return <AIChatFixedPanel {...props} />
}
