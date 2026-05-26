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

export const getScrollMarkReadExitedSliceEnd = ({
  indexes,
  renderedEndIndex,
}: {
  indexes: readonly number[]
  renderedEndIndex: number | null | undefined
}) => {
  if (typeof renderedEndIndex !== "number" || !Number.isFinite(renderedEndIndex)) {
    return null
  }

  let minimumIndex = Number.MAX_SAFE_INTEGER

  for (const index of indexes) {
    if (!Number.isInteger(index) || index < 0) {
      continue
    }

    if (index > renderedEndIndex) {
      continue
    }

    minimumIndex = Math.min(minimumIndex, index)
  }

  return minimumIndex === Number.MAX_SAFE_INTEGER ? null : minimumIndex + 1
}
