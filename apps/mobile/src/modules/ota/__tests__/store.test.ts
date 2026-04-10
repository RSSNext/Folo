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
  })
})
