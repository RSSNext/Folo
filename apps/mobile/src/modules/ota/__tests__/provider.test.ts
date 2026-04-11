import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("expo-application", () => ({
  nativeApplicationVersion: "0.4.1",
}))

vi.mock("expo-updates", () => ({
  default: {},
  channel: "production",
  runtimeVersion: "0.4.1",
  isEnabled: true,
  reloadAsync: vi.fn(),
  useUpdates: vi.fn(),
  UpdateInfoType: {
    NEW: "new",
  },
}))

vi.mock("react-native", () => ({
  InteractionManager: {
    runAfterInteractions: (callback: () => void) => {
      callback()
      return {
        cancel: vi.fn(),
      }
    },
  },
}))

let runSafeReloadUpdate: typeof import("../provider").runSafeReloadUpdate
let runWithSingleInFlight: typeof import("../provider").runWithSingleInFlight

beforeAll(async () => {
  ;({ runSafeReloadUpdate, runWithSingleInFlight } = await import("../provider"))
})

describe("runWithSingleInFlight", () => {
  it("deduplicates concurrent calls and clears after resolution", async () => {
    let resolveRun: ((value: { kind: "idle" }) => void) | null = null
    const inFlightRef: { current: Promise<{ kind: "idle" }> | null } = { current: null }
    const run = vi.fn(
      () =>
        new Promise<{ kind: "idle" }>((resolve) => {
          resolveRun = resolve
        }),
    )

    const first = runWithSingleInFlight({
      inFlightRef,
      run,
    })
    const second = runWithSingleInFlight({
      inFlightRef,
      run,
    })

    expect(run).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)

    expect(resolveRun).not.toBeNull()
    resolveRun!({ kind: "idle" })

    await expect(first).resolves.toEqual({ kind: "idle" })
    expect(inFlightRef.current).toBeNull()

    const nextRun = vi.fn().mockResolvedValue({ kind: "idle" as const })
    const third = runWithSingleInFlight({
      inFlightRef,
      run: nextRun,
    })

    await expect(third).resolves.toEqual({ kind: "idle" })
    expect(nextRun).toHaveBeenCalledTimes(1)
  })
})

describe("runSafeReloadUpdate", () => {
  it("does not reload when updates are disabled", async () => {
    const reload = vi.fn().mockResolvedValue(undefined)

    await runSafeReloadUpdate({
      isEnabled: false,
      pendingVersion: "0.4.3",
      reload,
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("does not reload when no pending update exists", async () => {
    const reload = vi.fn().mockResolvedValue(undefined)

    await runSafeReloadUpdate({
      isEnabled: true,
      pendingVersion: null,
      reload,
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("reloads when updates are enabled and a pending version exists", async () => {
    const reload = vi.fn().mockResolvedValue(undefined)

    await runSafeReloadUpdate({
      isEnabled: true,
      pendingVersion: "0.4.3",
      reload,
    })

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
