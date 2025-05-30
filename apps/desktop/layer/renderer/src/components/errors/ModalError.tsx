import { Button } from "@follow/components/ui/button/index.js"
import type { FC } from "react"

import { attachOpenInEditor } from "~/lib/dev"

import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { FeedbackIssue } from "../common/ErrorElement"
import { m } from "../common/Motion"
import { useCurrentModal } from "../ui/modal/stacked/hooks"
import { parseError } from "./helper"

const ModalErrorFallback: FC<AppErrorFallbackProps> = (props) => {
  const { message, stack } = parseError(props.error)
  const modal = useCurrentModal()
  return (
    <m.div
      className="bg-theme-background flex flex-col items-center justify-center rounded-md p-2"
      exit={{
        opacity: 0,
        scale: 0.9,
      }}
    >
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
          <Button onClick={() => modal.dismiss()} variant="outline">
            Close Modal
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload
          </Button>
        </div>

        <FeedbackIssue message={message!} stack={stack} error={props.error} />
      </div>
    </m.div>
  )
}
export default ModalErrorFallback
