import { parseHtml } from "@follow/utils/html"
import type { Components } from "hast-util-to-jsx-runtime"
import { useInsertionEffect } from "react"

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
    <article className="prose dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold !max-w-full px-2">
      {res.toContent()}
    </article>
  )
}
