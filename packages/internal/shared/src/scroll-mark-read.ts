export const MIN_SCROLL_MARK_READ_END_PADDING = 480
export const SCROLL_MARK_READ_END_INDICATOR_HEIGHT = 1

export const getScrollMarkReadEndPadding = (viewportHeight: number | null | undefined) => {
  if (typeof viewportHeight !== "number" || !Number.isFinite(viewportHeight)) {
    return MIN_SCROLL_MARK_READ_END_PADDING
  }

  return Math.max(viewportHeight - SCROLL_MARK_READ_END_INDICATOR_HEIGHT, 0)
}

export const shouldRenderScrollMarkReadEndSpacer = ({
  entryCount,
  hasNextPage,
}: {
  entryCount: number
  hasNextPage: boolean
}) => entryCount > 0 && !hasNextPage

export const getScrollMarkReadRange = ({
  previousEndIndex,
  currentStartIndex,
}: {
  previousEndIndex: number | null | undefined
  currentStartIndex: number | null | undefined
}) => {
  if (
    typeof previousEndIndex !== "number" ||
    !Number.isInteger(previousEndIndex) ||
    previousEndIndex < 0
  ) {
    return null
  }

  if (
    typeof currentStartIndex !== "number" ||
    !Number.isInteger(currentStartIndex) ||
    currentStartIndex <= previousEndIndex
  ) {
    return null
  }

  return {
    startIndex: previousEndIndex,
    endIndex: currentStartIndex,
  }
}

export const getScrollMarkReadRangeState = ({
  anchorIndex,
  currentStartIndex,
}: {
  anchorIndex: number | null | undefined
  currentStartIndex: number | null | undefined
}) => {
  if (
    typeof currentStartIndex !== "number" ||
    !Number.isInteger(currentStartIndex) ||
    currentStartIndex < 0
  ) {
    return {
      nextAnchorIndex:
        typeof anchorIndex === "number" && Number.isInteger(anchorIndex) && anchorIndex >= 0
          ? anchorIndex
          : null,
      range: null,
    }
  }

  return {
    nextAnchorIndex: currentStartIndex,
    range: getScrollMarkReadRange({
      previousEndIndex: anchorIndex,
      currentStartIndex,
    }),
  }
}

export type ScrollMarkReadItemBounds = {
  index: number
  top: number
  bottom: number
}

/**
 * The masonry counterpart of a virtual list's range start: the first item still in view.
 * A masonry puts every item into the shortest column, so item tops grow with the index and
 * every item before the first visible one has already scrolled out above the viewport.
 */
export const getScrollMarkReadMasonryStartIndex = ({
  items,
  viewportTop,
  viewportBottom,
}: {
  items: readonly ScrollMarkReadItemBounds[]
  viewportTop: number
  viewportBottom: number
}) => {
  let firstVisibleIndex: number | null = null
  let lastExitedIndex: number | null = null

  for (const { index, top, bottom } of items) {
    if (!Number.isInteger(index) || index < 0) {
      continue
    }

    if (bottom <= viewportTop) {
      lastExitedIndex = lastExitedIndex === null ? index : Math.max(lastExitedIndex, index)
    } else if (top < viewportBottom) {
      firstVisibleIndex = firstVisibleIndex === null ? index : Math.min(firstVisibleIndex, index)
    }
  }

  if (firstVisibleIndex !== null) {
    return firstVisibleIndex
  }

  // Nothing is in view once the list has scrolled past its last item
  return lastExitedIndex === null ? null : lastExitedIndex + 1
}
