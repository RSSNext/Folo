import { Button } from "@follow/components/ui/button/index.js"
import { captureException } from "@sentry/react"
import { useEffect, useRef } from "react"
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router"
import { toast } from "sonner"

import { removeAppSkeleton } from "~/lib/app"
import { attachOpenInEditor } from "~/lib/dev"
import { getNewIssueUrl } from "~/lib/issues"
import { clearLocalPersistStoreData } from "~/store/utils/clear"

import { PoweredByFooter } from "./PoweredByFooter"

export function ErrorElement() {
  const error = useRouteError()
  const navigate = useNavigate()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : JSON.stringify(error)
  const stack = error instanceof Error ? error.stack : null

  useEffect(() => {
    removeAppSkeleton()
  }, [])

  useEffect(() => {
    console.error("Error handled by React Router default ErrorBoundary:", error)

    captureException(error)
  }, [error])

  const reloadRef = useRef(false)
  if (
    message.startsWith("Failed to fetch dynamically imported module") &&
    window.sessionStorage.getItem("reload") !== "1"
  ) {
    if (reloadRef.current) return null
    toast.info("Web app has been updated so it needs to be reloaded.")
    window.sessionStorage.setItem("reload", "1")
    window.location.reload()
    reloadRef.current = true
    return null
  }

  return (
    <div className="m-auto flex min-h-full max-w-prose select-text flex-col p-8 pt-24">
      <div className="drag-region fixed inset-x-0 top-0 h-12" />
      <div className="center flex flex-col">
        <i className="i-mgc-bug-cute-re size-12 text-red-400" />
        <h2 className="mb-4 mt-12 text-2xl">Sorry, {APP_NAME} has encountered an error</h2>
      </div>
      <h3 className="text-xl">{message}</h3>
      {import.meta.env.DEV && stack ? (
        <pre className="mt-4 max-h-48 cursor-text overflow-auto whitespace-pre-line rounded-md bg-red-50 p-4 text-left font-mono text-sm text-red-600">
          {attachOpenInEditor(stack)}
        </pre>
      ) : null}

      <p className="my-8">
        {APP_NAME} has a temporary problem, click the button below to try reloading the app or
        another solution?
      </p>

      <div className="center gap-4">
        <Button
          variant="outline"
          onClick={() => {
            clearLocalPersistStoreData()
            window.location.href = "/"
          }}
        >
          Reset Local Database
        </Button>
        <Button
          onClick={() => {
            navigate("/")
            window.location.reload()
          }}
        >
          Reload
        </Button>
      </div>

      <FeedbackIssue message={message} stack={stack} error={error as Error} />
      <div className="grow" />

      <PoweredByFooter />
    </div>
  )
}

export const FeedbackIssue = (_props: {
  message: string
  stack: string | null | undefined
  error?: unknown
}) => (
  <p className="mt-8">
    Still having this issue? Please give feedback in GitHub, thanks!
    <a
      className="text-accent hover:text-accent/90 ml-2 cursor-pointer duration-200"
      href={getNewIssueUrl({
        // error: error instanceof Error ? error : undefined,
        // title: `Error: ${message}`,
        // body: ["### Error", "", message, "", "### Stack", "", "```", stack, "```"].join("\n"),
        // label: "bug",
        template: "bug_report.yml",
      })}
      target="_blank"
      rel="noreferrer"
    >
      Submit Issue
    </a>
  </p>
)
