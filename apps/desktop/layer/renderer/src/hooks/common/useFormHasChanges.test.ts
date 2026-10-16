import { describe, expect, it } from "vitest"

import { hasFormValueChanges } from "./useFormHasChanges"

describe("hasFormValueChanges", () => {
  it("reports no change for the values the form started with", () => {
    expect(
      hasFormValueChanges(
        { view: "0", title: "Blog", isPrivate: true },
        { view: "0", title: "Blog", isPrivate: true },
      ),
    ).toBe(false)
  })

  it("treats a cleared field and a switch turned off again as unchanged", () => {
    expect(hasFormValueChanges({ view: "0", title: "", isPrivate: false }, { view: "0" })).toBe(
      false,
    )
    expect(hasFormValueChanges({ category: null }, { category: undefined })).toBe(false)
  })

  it("reports edited, filled and cleared values", () => {
    expect(hasFormValueChanges({ view: "1" }, { view: "0" })).toBe(true)
    expect(hasFormValueChanges({ view: "0", title: "Mine" }, { view: "0" })).toBe(true)
    expect(hasFormValueChanges({ title: "" }, { title: "Blog" })).toBe(true)
    expect(hasFormValueChanges({ isPrivate: false }, { isPrivate: true })).toBe(true)
  })
})
