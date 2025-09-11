export * from "@follow-app/client-sdk"

export type ParsedFeedItem = {
  url: string
  title: string | null
  category?: string | null
}
