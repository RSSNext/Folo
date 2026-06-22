export const shouldCollectViewableItemsForMarkRead = ({
  disabled,
  isScrollingDown,
  offset,
}: {
  disabled?: boolean
  isScrollingDown: boolean
  offset: number
}) => !disabled && isScrollingDown && offset > 0
