import type { RemarkOptions } from "@follow/components/utils/parse-markdown.js"
import { parseMarkdown as parseMarkdownImpl } from "@follow/components/utils/parse-markdown.js"
import { createElement } from "react"

import { MarkdownLink } from "~/components/ui/markdown/renderers/MarkdownLink"
import { VideoPlayer } from "~/components/ui/media/VideoPlayer"

export const parseMarkdown = (content: string, options?: Partial<RemarkOptions>) => {
  const videoExts = ["mp4", "webm"]
  return parseMarkdownImpl(content, {
    ...options,
    components: {
      a: ({ node, ...props }) => createElement(MarkdownLink, { ...props } as any),
      img: ({ node, ...props }) => {
        const { src } = props
        try {
          const url = new URL(src || "")
          const path = url.pathname
          const search = url.searchParams
          const ratio = search.get("ratio")

          const isVideo = videoExts.some((ext) => path.endsWith(ext))
          if (isVideo) {
            if (ratio) {
              return createElement(
                "div",
                {
                  style: {
                    width: "100%",
                    paddingTop: `${(1 / Number(ratio)) * 100}%`,
                    position: "relative",
                  },
                },
                createElement(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    },
                  },
                  createElement(VideoPlayer, {
                    src: src as string,
                  }),
                ),
              )
            }
            return createElement(VideoPlayer, {
              src: src as string,
            })
          }
        } catch {
          // ignore
        }
        return createElement("img", { ...props } as any)
      },
      ...options?.components,
    },
  })
}

export { type RemarkOptions } from "@follow/components/utils/parse-markdown.js"
