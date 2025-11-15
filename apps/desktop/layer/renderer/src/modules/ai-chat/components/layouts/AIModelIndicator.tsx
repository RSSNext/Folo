import type { UserRole } from "@follow/constants"
import { UserRolePriority } from "@follow/constants"
import { useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import { Fragment, memo, useMemo } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { useAIModel } from "../../hooks/useAIModel"

interface AIModelIndicatorProps {
  className?: string
  onModelChange?: (model: string) => void
}

type ProviderType = "openai" | "google" | "auto" | "deepseek" | "anthropic" | "moonshotai"

const providerIcons: Record<ProviderType, string> = {
  auto: "i-mgc-folo-bot-original size-4 -ml-0.5",
  openai: "i-mgc-openai-original",
  google: "i-simple-icons-googlegemini",
  anthropic: "i-simple-icons-claude",
  deepseek: "i-mgc-deepseek-original",
  moonshotai: "i-mgc-moonshotai-original",
}

const MODEL_PAID_LEVELS = ["basic", "plus", "pro"] as const
type ModelPaidLevel = (typeof MODEL_PAID_LEVELS)[number]

const paidLevelPriority: Record<ModelPaidLevel, number> = {
  basic: 1,
  plus: 2,
  pro: 3,
}

const paidLevelBadgeStyles: Record<ModelPaidLevel, string> = {
  basic: "border-green/30 bg-green/10 text-green",
  plus: "border-blue/30 bg-blue/10 text-blue",
  pro: "border-purple/40 bg-purple/10 text-purple",
}

const paidLevelLabels: Record<ModelPaidLevel, string> = {
  basic: "Basic",
  plus: "Plus",
  pro: "Pro",
}

const isModelPaidLevel = (value: unknown): value is ModelPaidLevel => {
  return typeof value === "string" && MODEL_PAID_LEVELS.includes(value as ModelPaidLevel)
}

const hasAccessToPaidLevel = (role: UserRole | null | undefined, level?: ModelPaidLevel) => {
  if (!level) return true
  const roleScore = role ? (UserRolePriority[role] ?? 0) : 0
  return roleScore >= paidLevelPriority[level]
}

const parseModelString = (modelString: string) => {
  if (!modelString || !modelString.includes("/") || modelString === "auto") {
    return { provider: "auto" as ProviderType, modelName: modelString || "Unknown" }
  }

  const [provider, ...modelParts] = modelString.split("/")
  const modelName = modelParts.join("/")

  return {
    provider: (provider as ProviderType) || "auto",
    modelName: modelName || "Unknown",
  }
}

export const AIModelIndicator = memo(({ className, onModelChange }: AIModelIndicatorProps) => {
  const { data, changeModel } = useAIModel()
  const { defaultModel, availableModels = [], currentModel, availableModelsMenu = [] } = data || {}
  const role = useUserRole()
  const settingModalPresent = useSettingModal()

  const { provider, modelName } = useMemo(() => {
    return parseModelString(currentModel || defaultModel || "")
  }, [currentModel, defaultModel])

  const selectedMenuItem = useMemo(() => {
    return availableModelsMenu.find((item) => item.value === currentModel)
  }, [availableModelsMenu, currentModel])

  const iconClass = providerIcons[provider] || providerIcons.auto
  const hasMultipleModels = availableModels && availableModels.length > 1

  const modelContent = (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-xl border font-medium backdrop-blur-sm transition-colors",
        hasMultipleModels
          ? "cursor-button hover:bg-material-medium"
          : "hover:bg-material-medium/50",
        "duration-200",
        "gap-1.5 p-1 text-xs",
        hasMultipleModels && "px-2",
        "border-border/50 bg-material-ultra-thin",
        "text-text-secondary",

        className,
      )}
    >
      <i className={cn("size-3", iconClass)} />
      <span className="hidden max-w-20 truncate @md:inline">
        {selectedMenuItem?.label || modelName}
      </span>
      {hasMultipleModels && <i className="i-mingcute-down-line size-3 opacity-60" />}
    </div>
  )

  if (!hasMultipleModels) {
    return modelContent
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{modelContent}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {availableModelsMenu.map(({ label, value, paidLevel }, index) => {
          if (value) {
            const { provider: itemProvider, modelName: itemModelName } = parseModelString(value)
            const itemIconClass = providerIcons[itemProvider] || providerIcons.auto
            const isSelected = value === (currentModel || defaultModel)
            const normalizedPaidLevel = isModelPaidLevel(paidLevel) ? paidLevel : undefined
            const requiresUpgrade = !hasAccessToPaidLevel(role, normalizedPaidLevel)

            const handleModelSelect = () => {
              if (requiresUpgrade) {
                settingModalPresent("plan")
                return
              }
              changeModel(value)
              onModelChange?.(value)
            }

            return (
              <DropdownMenuItem
                key={value}
                className={cn("gap-2", requiresUpgrade && "text-text-secondary")}
                onClick={handleModelSelect}
                checked={isSelected}
              >
                <i className={cn("size-3", itemIconClass)} />
                <span className="truncate">{label || itemModelName}</span>
                {normalizedPaidLevel && (
                  <span
                    className={cn(
                      "ml-auto inline-flex rounded-full border px-1.5 text-[9px] font-semibold uppercase tracking-wide",
                      paidLevelBadgeStyles[normalizedPaidLevel],
                    )}
                  >
                    {paidLevelLabels[normalizedPaidLevel]}
                  </span>
                )}
              </DropdownMenuItem>
            )
          } else {
            return (
              <Fragment key={label}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
              </Fragment>
            )
          }
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

AIModelIndicator.displayName = "AIModelIndicator"
