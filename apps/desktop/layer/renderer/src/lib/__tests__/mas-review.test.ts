import { describe, expect, it } from "vitest"

import { getMASStoreVersionFromOTAVersions, isLocalMASVersionInReview } from "../mas-review"

describe("getMASStoreVersionFromOTAVersions", () => {
  it("reads the MAS version from the OTA payload", () => {
    expect(
      getMASStoreVersionFromOTAVersions({
        store: {
          desktop: {
            mas: {
              version: "1.6.0",
            },
          },
        },
      }),
    ).toBe("1.6.0")
  })

  it("returns null when the OTA payload has no MAS version", () => {
    expect(getMASStoreVersionFromOTAVersions({})).toBeNull()
  })
})

describe("isLocalMASVersionInReview", () => {
  it("returns true when the local MAS build is newer than the store version", () => {
    expect(
      isLocalMASVersionInReview({
        isMASBuild: true,
        localVersion: "1.6.1",
        storeVersion: "1.6.0",
      }),
    ).toBe(true)
  })

  it("returns false when the local version matches the store version", () => {
    expect(
      isLocalMASVersionInReview({
        isMASBuild: true,
        localVersion: "1.6.1",
        storeVersion: "1.6.1",
      }),
    ).toBe(false)
  })

  it("returns false when the build is not a MAS build", () => {
    expect(
      isLocalMASVersionInReview({
        isMASBuild: false,
        localVersion: "1.6.1",
        storeVersion: "1.6.0",
      }),
    ).toBe(false)
  })

  it("returns false when the store version is missing or invalid", () => {
    expect(
      isLocalMASVersionInReview({
        isMASBuild: true,
        localVersion: "1.6.1",
        storeVersion: null,
      }),
    ).toBe(false)

    expect(
      isLocalMASVersionInReview({
        isMASBuild: true,
        localVersion: "1.6.1",
        storeVersion: "latest",
      }),
    ).toBe(false)
  })
})
