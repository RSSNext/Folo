import type { Components } from "hast-util-to-jsx-runtime"
import { useInsertionEffect } from "react"

import { parseHtml } from "./parse-html"

export type ParseHtmlOptions = {
  renderInlineStyle?: boolean
  noMedia?: boolean
  components?: Components
  scrollEnabled?: boolean
}

export type HtmlProps = { content: string } & ParseHtmlOptions

export function Html({ content, scrollEnabled = true, ...options }: HtmlProps) {
  const res = parseHtml(content, options)

  useInsertionEffect(() => {
    const originalOverflow = document.body.style.overflow

    if (!scrollEnabled) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = originalOverflow
      document.documentElement.style.overflow = originalOverflow
    }
  }, [scrollEnabled])

  return (
    <article className="prose !max-w-full px-2 dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold">
      {res.toContent()}
    </article>
  )
}
