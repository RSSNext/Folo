import { Button } from "@follow/components/ui/button/index.js"
import type { FC } from "react"

import { attachOpenInEditor } from "~/lib/dev"

import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { FeedbackIssue } from "../common/ErrorElement"
import { parseError, useResetErrorWhenRouteChange } from "./helper"

const PageErrorFallback: FC<AppErrorFallbackProps> = (props) => {
  const { message, stack } = parseError(props.error)
  useResetErrorWhenRouteChange(props.resetError)
  return (
    <div className="bg-theme-background pointer-events-auto flex w-full flex-col items-center justify-center rounded-md p-2">
      <div className="m-auto max-w-prose text-center">
        <div className="mb-4">
          <i className="i-mgc-bug-cute-re text-4xl text-red-500" />
        </div>
        <div className="text-lg font-bold">{message}</div>
        {import.meta.env.DEV && stack ? (
          <pre className="mt-4 max-h-48 cursor-text select-text overflow-auto whitespace-pre-line rounded-md bg-red-50 p-4 text-left font-mono text-sm text-red-600">
            {attachOpenInEditor(stack)}
          </pre>
        ) : null}

        <p className="my-8">
          {APP_NAME} has a temporary problem, click the button below to try reloading the app or
          another solution?
        </p>

        <div className="center gap-4">
          <Button onClick={() => props.resetError()} variant="primary">
            Retry
          </Button>

          <Button onClick={() => window.location.reload()} variant="outline">
            Reload
          </Button>
        </div>

        <FeedbackIssue message={message!} stack={stack} error={props.error} />
      </div>
    </div>
  )
}

export default PageErrorFallback
