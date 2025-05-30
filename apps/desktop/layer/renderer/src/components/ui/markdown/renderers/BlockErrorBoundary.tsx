import { captureException } from "@sentry/react"
import { useEffect } from "react"

export const BlockError = (props: { error: any; message: string }) => {
  useEffect(() => {
    captureException(props.error)
  }, [])
  return (
    <div className="center bg-red flex min-h-12 flex-col rounded py-4 text-sm text-white">
      {props.message}

      <pre className="m-0 bg-transparent">{props.error?.message}</pre>
    </div>
  )
}
