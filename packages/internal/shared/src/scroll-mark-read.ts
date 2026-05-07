export const MIN_SCROLL_MARK_READ_END_PADDING = 480

export const getScrollMarkReadEndPadding = (viewportHeight: number | null | undefined) => {
  if (typeof viewportHeight !== "number" || !Number.isFinite(viewportHeight)) {
    return MIN_SCROLL_MARK_READ_END_PADDING
  }

  return Math.max(viewportHeight, MIN_SCROLL_MARK_READ_END_PADDING)
}

export const shouldRenderScrollMarkReadEndSpacer = ({
  entryCount,
  hasNextPage,
}: {
  entryCount: number
  hasNextPage: boolean
}) => entryCount > 0 && !hasNextPage
