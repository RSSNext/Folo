import { describe, expect, it } from "vitest"

import { reduceOtaState } from "../store"

describe("reduceOtaState", () => {
  it("marks an update as downloaded and ready on next launch", () => {
    const state = reduceOtaState(
      {
        status: "idle",
        pendingVersion: null,
        errorMessage: null,
      },
      {
        type: "downloaded",
        version: "0.4.2",
      },
    )

    expect(state.status).toBe("ready")
    expect(state.pendingVersion).toBe("0.4.2")
    expect(state.errorMessage).toBeNull()
  })

  it("stores the latest error without clearing the pending version", () => {
    const state = reduceOtaState(
      {
        status: "ready",
        pendingVersion: "0.4.2",
        errorMessage: null,
      },
      {
        type: "failed",
        message: "Network unavailable",
      },
    )

    expect(state.status).toBe("error")
    expect(state.pendingVersion).toBe("0.4.2")
    expect(state.errorMessage).toBe("Network unavailable")
  })

  it("resets the OTA state back to idle", () => {
    const state = reduceOtaState(
      {
        status: "error",
        pendingVersion: "0.4.2",
        errorMessage: "Network unavailable",
      },
      {
        type: "reset",
      },
    )

    expect(state.status).toBe("idle")
    expect(state.pendingVersion).toBeNull()
    expect(state.errorMessage).toBeNull()
  })
})
