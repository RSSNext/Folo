export type CleanerType = "feed" | "entry" | "list" | "inbox"
export type DB_Cleaner = {
  refId: string
  visitedAt: number
  type: CleanerType
}
