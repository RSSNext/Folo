import type { FC } from "react"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"

import { AIChatFixedPanel } from "./AIChatFixedPanel"
import { AIChatFloatingPanel } from "./AIChatFloatingPanel"

export interface AIChatLayoutProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

/**
 * AIChatLayout Component
 *
 * A dynamic layout component for AI chat functionality that switches between
 * different panel styles based on user preferences.
 *
 * Supported Layouts:
 * - Fixed Panel: Chat interface integrated as a fixed sidebar/panel
 * - Floating Panel: Chat interface as a draggable floating window
 *
 * The layout style is controlled by the AIChatPanelStyle setting and automatically
 * renders the appropriate panel implementation.
 *
 * @component
 * @param props - Standard div HTML attributes passed to the selected panel
 * @example
 * // Renders based on user's AI chat panel style preference
 * <AIChatLayout className="custom-class" />
 */
export const AIChatLayout: FC<AIChatLayoutProps> = ({ ...props }) => {
  const panelStyle = useAIChatPanelStyle()

  if (panelStyle === AIChatPanelStyle.Floating) {
    return <AIChatFloatingPanel {...props} />
  }
  return <AIChatFixedPanel {...props} />
}
