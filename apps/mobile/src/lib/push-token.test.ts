import { apiContext } from "@follow/store/context"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { unregisterPushToken } from "./push-token"

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }))

const deleteToken = vi.fn()

beforeEach(() => {
  deleteToken.mockReset()
  apiContext.provide({ messaging: { deleteToken } } as unknown as Parameters<
    typeof apiContext.provide
  >[0])
})

describe("unregisterPushToken", () => {
  it("asks the server to forget this platform's token, without waiting long", async () => {
    deleteToken.mockResolvedValue({ code: 0 })

    await unregisterPushToken()

    expect(deleteToken).toHaveBeenCalledWith({ channel: "ios" }, { timeout: 5000 })
  })

  it("lets the sign-out go on when the server cannot be reached", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    deleteToken.mockRejectedValue(new Error("fetch failed: offline"))

    await expect(unregisterPushToken()).resolves.toBeUndefined()
  })
})
