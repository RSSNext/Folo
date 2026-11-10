export const getNotionArticleContent = (
  entry: { content?: string | null; readabilityContent?: string | null },
  readabilityReady: boolean,
): string => (readabilityReady ? entry.readabilityContent || entry.content : entry.content) || ""

export const getNotionPageUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null
    if (
      !["notion.so", "notion.site"].some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    )
      return null
    return url.href
  } catch {
    return null
  }
}

/** Read only completed cached summaries for the exact exported body variant. */
export const getNotionCachedSummary = (
  entry: { readabilityContent?: string | null },
  readabilityReady: boolean,
  cached?: { summary: string; readabilitySummary: string | null },
) =>
  readabilityReady && !!entry.readabilityContent
    ? cached?.readabilitySummary || undefined
    : cached?.summary || undefined
