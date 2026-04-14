import { describe, expect, it } from "vitest"

import { resolveRuntimeVersion } from "../app.config.base"

describe("resolveRuntimeVersion", () => {
  it("keeps the development runtime version stable", () => {
    expect(
      resolveRuntimeVersion({
        isDevelopment: true,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4.1",
      }),
    ).toBe("0.0.0-dev")
  })

  it("uses OTA_RUNTIME_VERSION for OTA exports", () => {
    expect(
      resolveRuntimeVersion({
        isDevelopment: false,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4.1",
      }),
    ).toBe("0.4.1")
  })

  it("rejects invalid OTA runtime versions", () => {
    expect(() =>
      resolveRuntimeVersion({
        isDevelopment: false,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4",
      }),
    ).toThrow(/OTA_RUNTIME_VERSION/i)
  })
})
