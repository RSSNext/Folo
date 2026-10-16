export const shouldCollectViewableItemsForMarkRead = ({
  disabled,
  isScrollingDown,
  offset,
}: {
  disabled?: boolean
  isScrollingDown: boolean
  offset: number
}) => !disabled && isScrollingDown && offset > 0

/**
 * The scrolled-out items still waiting to be marked read once `markedIds` were handed off.
 * The result is stored in state that triggers the marking, so it keeps the same array when
 * nothing changed and is null when nothing is left. Any new array would mark again, which
 * resolves at once for entries that are already read, and so would loop without end.
 */
export const getPendingMarkReadItems = <T>(
  items: T[] | null,
  markedIds: ReadonlySet<string>,
  getId: (item: T) => string,
): T[] | null => {
  if (!items) return null

  const pending = items.filter((item) => !markedIds.has(getId(item)))
  if (pending.length === items.length) return items
  return pending.length > 0 ? pending : null
}
