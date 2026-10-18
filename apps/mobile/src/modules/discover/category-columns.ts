/**
 * How many category cards fit side by side in a window this wide. Phones get two; wider iPad
 * windows get more instead of ever larger 16:9 cards, which on a 13-inch iPad in landscape showed
 * one row per screen.
 */
export const getCategoryGridColumns = (windowWidth: number) => {
  if (windowWidth < 700) return 2
  if (windowWidth < 1000) return 3
  return 4
}
