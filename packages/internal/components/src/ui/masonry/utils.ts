const breakpoints = {
  0: 2,
  // 32rem => 32 * 16= 512
  512: 3,
  // 48rem => 48 * 16= 768
  768: 4,
  // 72rem => 72 * 16= 1152
  1024: 5,
  // 80rem => 80 * 16= 1280
  1280: 6,
  1536: 7,
  1792: 8,
  2048: 9,
}

export const getCurrentColumn = (w: number) => {
  // Initialize column count with the minimum number of columns
  let columns = 1

  // Iterate through each breakpoint and determine the column count
  for (const [breakpoint, cols] of Object.entries(breakpoints)) {
    if (w >= Number.parseInt(breakpoint)) {
      columns = cols
    } else {
      break
    }
  }

  return columns
}
