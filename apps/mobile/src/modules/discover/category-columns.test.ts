import { describe, expect, test } from "vitest"

import { getCategoryGridColumns } from "./category-columns"

describe("getCategoryGridColumns", () => {
  test("keeps two columns at phone widths, including a phone-wide iPad window", () => {
    expect(getCategoryGridColumns(375)).toBe(2)
    expect(getCategoryGridColumns(440)).toBe(2)
    expect(getCategoryGridColumns(678)).toBe(2)
  })

  test("adds columns as an iPad window gets wider", () => {
    // iPad mini and 11-inch iPads in portrait
    expect(getCategoryGridColumns(744)).toBe(3)
    expect(getCategoryGridColumns(834)).toBe(3)
    // A 13-inch iPad in portrait and in landscape
    expect(getCategoryGridColumns(1032)).toBe(4)
    expect(getCategoryGridColumns(1376)).toBe(4)
  })
})
