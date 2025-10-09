import { cn } from "@follow/utils"
import { memo, useMemo } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"

import { useAIModel } from "../../hooks/useAIModel"

interface AIModelIndicatorProps {
  className?: string
  onModelChange?: (model: string) => void
}

type ProviderType = "openai" | "google" | "auto"

const providerIcons: Record<ProviderType, string> = {
  openai: "i-simple-icons-openai",
  google: "i-simple-icons-googlegemini",
  auto: "i-simple-icons-folo",
}

const AIModelNameMapping = {
  auto: "Auto",
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5-nano": "GPT-5 nano",
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
  const { defaultModel, availableModels = [], currentModel } = data || {}

  const { provider, modelName } = useMemo(() => {
    return parseModelString(currentModel || defaultModel || "")
  }, [currentModel, defaultModel])

  const iconClass = providerIcons[provider] || providerIcons.auto
  const hasMultipleModels = availableModels && availableModels.length > 1

  const modelContent = (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-medium backdrop-blur-sm transition-colors",
        hasMultipleModels
          ? "hover:bg-material-medium cursor-button"
          : "hover:bg-material-medium/50",
        "duration-200",
        "gap-1.5 p-1 text-xs",
        hasMultipleModels && "px-2",
        "bg-material-ultra-thin border-border/50",
        "text-text-secondary",

        className,
      )}
    >
      <i className={cn("size-3", iconClass)} />
      <span className="@md:inline hidden max-w-20 truncate">
        {AIModelNameMapping[modelName] || modelName}
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
        {availableModels.map((model) => {
          const { provider: itemProvider, modelName: itemModelName } = parseModelString(model)
          const itemIconClass = providerIcons[itemProvider] || providerIcons.auto
          const isSelected = model === (currentModel || defaultModel)

          const handleModelSelect = () => {
            changeModel(model)
            onModelChange?.(model)
          }

          return (
            <DropdownMenuItem
              key={model}
              className="gap-2"
              onClick={handleModelSelect}
              checked={isSelected}
            >
              <i className={cn("size-3", itemIconClass)} />
              <span className="truncate">{AIModelNameMapping[itemModelName] || itemModelName}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

AIModelIndicator.displayName = "AIModelIndicator"
