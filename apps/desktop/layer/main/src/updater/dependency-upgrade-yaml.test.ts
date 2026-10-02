import { dump, load } from "js-yaml"
import { describe, expect, it } from "vitest"

describe("updater YAML dependency contract", () => {
  it("roundtrips release metadata without changing hashes, dates or whitespace strings", () => {
    const source = `version: 0.7.0
files:
  - url: Folo-0.7.0-arm64.zip
    sha512: abc/DEF+123==
    size: 9007199254740991
path: Folo-0.7.0-arm64.zip
sha512: abc/DEF+123==
releaseDate: '2026-09-22T00:00:00.000Z'
releaseNotes: |-
  阅读器更新
  A: B # text
`
    const manifest = load(source) as Record<string, unknown>
    const merged = { ...manifest, releaseName: " ", version: "0.7.1" }
    expect(load(dump(merged, { lineWidth: -1 }))).toEqual(merged)
    expect(manifest.releaseDate).toBe("2026-09-22T00:00:00.000Z")
    expect(manifest.files).toEqual([
      { url: "Folo-0.7.0-arm64.zip", sha512: "abc/DEF+123==", size: Number.MAX_SAFE_INTEGER },
    ])
  })
})
