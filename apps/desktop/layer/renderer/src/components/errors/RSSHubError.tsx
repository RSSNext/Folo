import type { FC } from "react"

import { attachOpenInEditor } from "~/lib/dev"

import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { FeedbackIssue } from "../common/ErrorElement"
import { parseError } from "./helper"

const RSSHubErrorFallback: FC<AppErrorFallbackProps> = (props) => {
  const { message, stack } = parseError(props.error)

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="m-auto max-w-prose text-center">
        <p className="center my-3 gap-2 font-bold">
          <i className="i-mgc-bug-cute-re text-red-500" />
          RSSHub has a temporary problem, please contact the our team.
        </p>
        <div className="text-lg">{message}</div>
        {import.meta.env.DEV && stack ? (
          <pre className="mt-4 max-h-48 cursor-text overflow-auto whitespace-pre-line rounded-md bg-red-50 p-4 text-left font-mono text-sm text-red-600">
            {attachOpenInEditor(stack)}
          </pre>
        ) : null}

        <FeedbackIssue message={message!} stack={stack} error={props.error} />
      </div>
    </div>
  )
}
export default RSSHubErrorFallback
