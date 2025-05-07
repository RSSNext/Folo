export type RendererHandlers = {
  invalidateQuery: (key: (string | number | undefined)[]) => void
  updateDownloaded: () => void
  navigateEntry: (options: { feedId: string; entryId: string; view: number }) => void
}
