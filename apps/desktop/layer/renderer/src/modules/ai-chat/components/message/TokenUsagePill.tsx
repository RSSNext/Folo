import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { isFreeRole } from "@follow/constants"
import { useUserRole } from "@follow/store/user/hooks"
import type { BizUIMetadata } from "@folo-services/ai-tools"
import * as React from "react"

import { formatTokenCountString } from "~/modules/settings/tabs/ai/usage/utils"

interface TokenUsagePillProps {
  metadata: BizUIMetadata | undefined
  className?: string
  children: React.ReactNode
}

const formatDuration = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

export const TokenUsagePill: React.FC<TokenUsagePillProps> = ({ metadata, children }) => {
  const userRole = useUserRole()
  if (!metadata) return null
  const isFreeUser = userRole ? isFreeRole(userRole) : false
  const summarizedTokens =
    metadata.billedTokens ??
    metadata.totalTokens ??
    metadata.outputTokens ??
    metadata.contextTokens ??
    null

  const hasReasoningTokens = metadata.reasoningTokens != null && metadata.reasoningTokens > 0
  const hasCachedInputTokens = metadata.cachedInputTokens != null && metadata.cachedInputTokens > 0
  const hasBillingMultiplier =
    metadata.billingMultiplier != null && metadata.billingMultiplier !== 1
  const hasDuration = metadata.duration != null

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="top" className="p-2" align="center" sideOffset={8}>
          <div className="mb-2 flex flex-col gap-2">
            <div className="text-xs text-text">Model Info</div>
            <div className="font-mono text-xs text-text-secondary">
              {metadata.modelUsed ?? "Unknown"}
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-medium text-text">AI Credits Usage</div>
            {isFreeUser ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <span className="text-text-secondary">Credits:</span>
                <span className="font-mono text-text">
                  {summarizedTokens != null ? formatTokenCountString(summarizedTokens) : "—"}
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {metadata.totalTokens != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Total:</span>
                      <span className="font-mono text-text">
                        {formatTokenCountString(metadata.totalTokens)}
                      </span>
                    </div>
                  )}
                  {metadata.billedTokens != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Billed:</span>
                      <span className="font-mono text-accent">
                        {formatTokenCountString(metadata.billedTokens)}
                      </span>
                    </div>
                  )}
                  {metadata.contextTokens != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Context:</span>
                      <span className="font-mono text-text">
                        {formatTokenCountString(metadata.contextTokens)}
                      </span>
                    </div>
                  )}
                  {metadata.outputTokens != null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Output:</span>
                      <span className="font-mono text-text">
                        {formatTokenCountString(metadata.outputTokens)}
                      </span>
                    </div>
                  )}
                  {hasReasoningTokens && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Reasoning:</span>
                      <span className="font-mono text-text">
                        {formatTokenCountString(metadata.reasoningTokens!)}
                      </span>
                    </div>
                  )}
                  {hasCachedInputTokens && (
                    <div className="flex justify-between gap-2">
                      <span className="text-text-secondary">Cached:</span>
                      <span className="font-mono text-text">
                        {formatTokenCountString(metadata.cachedInputTokens!)}
                      </span>
                    </div>
                  )}
                </div>
                {(hasDuration || hasBillingMultiplier) && (
                  <>
                    <hr className="border-fill-secondary" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {hasDuration && (
                        <div className="flex justify-between gap-2">
                          <span className="text-text-secondary">Duration:</span>
                          <span className="font-mono text-text">
                            {formatDuration(metadata.duration!)}
                          </span>
                        </div>
                      )}
                      {hasBillingMultiplier && (
                        <div className="flex justify-between gap-2">
                          <span className="text-text-secondary">Multiplier:</span>
                          <span className="font-mono text-text">
                            {metadata.billingMultiplier!}×
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
