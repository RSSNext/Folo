import { Button } from "@follow/components/ui/button/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"

export interface ActionButton {
  icon: string
  onClick: () => void
  title?: string
  disabled?: boolean
  loading?: boolean
}

export interface ItemActionsProps {
  /**
   * Array of action buttons to display
   */
  actions: ActionButton[]

  /**
   * Whether the item is enabled
   */
  enabled: boolean

  /**
   * Callback when the switch is toggled
   */
  onToggle: (enabled: boolean) => void
}

/**
 * Reusable component for item actions (buttons + switch)
 * Used across AI Task Item, AI Shortcut Item, and MCP Service Item
 */
export const ItemActions = ({ actions, enabled, onToggle }: ItemActionsProps) => {
  return (
    <div className="ml-4 flex items-center gap-3">
      {/* Action buttons group */}
      <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
        {actions.map((action) =>
          action.title ? (
            <Tooltip key={action.title} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.loading ? (
                    <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
                  ) : (
                    <i className={`${action.icon} size-4`} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.title}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              key={action.icon}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.loading ? (
                <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
              ) : (
                <i className={`${action.icon} size-4`} />
              )}
            </Button>
          ),
        )}
      </div>

      {/* Switch area */}
      <div className="flex items-center gap-2 border-l border-fill-tertiary pl-3">
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
    </div>
  )
}
