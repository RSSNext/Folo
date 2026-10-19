/**
 * The tab a pager shows at `offset`, or undefined while that cannot be known: the pager reports
 * its offset from its first scroll, which can come before the tab bar has a width to divide it by.
 * An overscroll past either end stays on the first or last tab.
 */
export const getPagerTabIndex = (
  offset: number,
  pageWidth: number,
  tabCount: number,
): number | undefined => {
  if (!(pageWidth > 0) || tabCount <= 0 || !Number.isFinite(offset)) return undefined
  const index = Math.round(offset / pageWidth)
  return Math.min(Math.max(index, 0), tabCount - 1)
}
