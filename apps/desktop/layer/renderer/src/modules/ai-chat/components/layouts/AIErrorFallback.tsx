import { Button } from "@follow/components/ui/button/index.js"
import type { FallbackRender } from "@sentry/react"

import { attachOpenInEditor } from "~/lib/dev"

import { FeedbackIssue } from "../../../../components/common/ErrorElement"
import { parseError } from "../../../../components/errors/helper"

export const AIErrorFallback: FallbackRender = (props) => {
  const { message, stack } = parseError(props.error)

  return (
    <div className="absolute inset-0 mx-auto flex max-w-2xl flex-col items-center justify-center rounded-lg bg-theme-background p-8 shadow-sm">
      <div className="text-center">
        {/* AI-specific icon */}
        <div className="mb-6">
          <i className="i-mgc-ai-cute-re text-5xl text-orange" />
        </div>

        {/* Error title */}
        <h2 className="mb-3 text-xl font-semibold text-text">AI Chat Encountered an Error</h2>

        {/* Error message */}
        <div className="mb-6 text-sm leading-relaxed text-text-secondary">
          {message || "An unexpected error occurred while processing your request."}
        </div>

        {/* Development stack trace */}
        {import.meta.env.DEV && stack ? (
          <details className="mb-6 text-left">
            <summary className="mb-2 cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
              Show technical details
            </summary>
            <pre className="max-h-32 cursor-text select-text overflow-auto whitespace-pre-wrap rounded-md border border-border/40 bg-fill p-3 font-mono text-xs text-text-secondary">
              {attachOpenInEditor(stack)}
            </pre>
          </details>
        ) : null}

        {/* Error description */}
        <p className="mb-8 text-sm leading-relaxed text-text-tertiary">
          Don't worry! You can try again or reload the chat to continue your conversation.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => props.resetError()} variant="primary">
            Try Again
          </Button>

          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>

        {/* Feedback component */}
        <div className="mt-8 border-t border-border/40 pt-6">
          <FeedbackIssue message={message || "AI Chat Error"} stack={stack} error={props.error} />
        </div>
      </div>
    </div>
  )
}
