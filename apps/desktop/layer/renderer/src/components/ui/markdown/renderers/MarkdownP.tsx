import * as React from "react"

import { MarkdownRenderActionContext } from "../context"
import { IsInParagraphContext } from "./ctx"

export const MarkdownP: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> & {
    /** A paragraph holding block content, like a block image, must not be a <p> */
    as?: "p" | "div"
  }
> = ({ children, as: Tag = "p", ...props }) => {
  const { isAudio, ensureAndRenderTimeStamp } = React.use(MarkdownRenderActionContext)
  const parseTimeline = isAudio()
  if (parseTimeline && typeof children === "string") {
    const renderer = ensureAndRenderTimeStamp(children)
    if (renderer) return <Tag>{renderer}</Tag>
  }

  if (parseTimeline && Array.isArray(children)) {
    return (
      <Tag>
        {children.map((child, index) => {
          if (typeof child === "string") {
            const renderer = ensureAndRenderTimeStamp(child)
            if (renderer) return <React.Fragment key={index}>{renderer}</React.Fragment>
          }
          return <React.Fragment key={index}>{child}</React.Fragment>
        })}
      </Tag>
    )
  }

  return (
    <Tag {...props}>
      <IsInParagraphContext value={true}>{children}</IsInParagraphContext>
    </Tag>
  )
}
