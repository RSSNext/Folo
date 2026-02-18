import { tracker } from "@follow/tracker"
import { useEffect } from "react"

export const BlockError = (props: { error: any; message: string }) => {
  useEffect(() => {
    console.error(props.error)
    void tracker.manager.captureException(props.error, {
      source: "desktop_markdown_block_error",
      message: props.message,
    })
  }, [props.error, props.message])
  return (
    <div className="center flex min-h-12 flex-col rounded bg-red py-4 text-sm text-white">
      {props.message}

      <pre className="m-0 bg-transparent">{props.error?.message}</pre>
    </div>
  )
}
