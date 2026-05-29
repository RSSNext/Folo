import type { EntryModel } from "@follow/store/entry/types"

import { getReadabilityStatus, ReadabilityStatus } from "~/atoms/readability"
import { parseHtml } from "~/lib/parse-html"

export const convertHtmlToIntegrationMarkdown = async (content: string) => {
  if (!content) return ""

  try {
    const [toMarkdown, toMdast, gfmTableToMarkdown] = await Promise.all([
      import("mdast-util-to-markdown").then((m) => m.toMarkdown),
      import("hast-util-to-mdast").then((m) => m.toMdast),
      import("mdast-util-gfm-table").then((m) => m.gfmTableToMarkdown),
    ])
    return toMarkdown(toMdast(parseHtml(content).hastTree), {
      extensions: [gfmTableToMarkdown()],
      handlers: {
        break: () => "\n",
      },
    })
  } catch {
    return content
  }
}

export const getEntryContentAsMarkdown = async (entry: EntryModel) => {
  const isReadabilityReady = getReadabilityStatus()[entry.id] === ReadabilityStatus.SUCCESS
  const content = (isReadabilityReady ? entry.readabilityContent || "" : entry.content) || ""
  return convertHtmlToIntegrationMarkdown(content)
}
