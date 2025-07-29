import * as React from "react"

import { MarkdownRenderActionContext } from "../context"
import { IsInParagraphContext } from "./ctx"

export const MarkdownP: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ children, ...props }) => {
  const { isAudio, ensureAndRenderTimeStamp } = React.use(MarkdownRenderActionContext)
  const parseTimeline = isAudio()
  if (parseTimeline && typeof children === "string") {
    const renderer = ensureAndRenderTimeStamp(children)
    if (renderer) return <p>{renderer}</p>
  }

  if (parseTimeline && Array.isArray(children)) {
    return (
      <p>
        {children.map((child, index) => {
          if (typeof child === "string") {
            const renderer = ensureAndRenderTimeStamp(child)
            if (renderer) return <React.Fragment key={index}>{renderer}</React.Fragment>
          }
          return <React.Fragment key={index}>{child}</React.Fragment>
        })}
      </p>
    )
  }

  return (
    <p {...props}>
      <IsInParagraphContext value={true}>{children}</IsInParagraphContext>
    </p>
  )
}
