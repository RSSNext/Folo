import { describe, expect, it } from "vitest"

import { buildAppFontFamily } from "../font-family"

describe("buildAppFontFamily", () => {
  it("keeps generic families unquoted and adds CJK fallbacks", () => {
    expect(buildAppFontFamily("system-ui")).toBe(
      'system-ui, "SN Pro", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
    )
  })

  it("deduplicates preferred fonts that already exist in the fallback stack", () => {
    expect(buildAppFontFamily("PingFang SC")).toBe(
      '"PingFang SC", "SN Pro", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif',
    )
  })
})
