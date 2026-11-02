import { describe, expect, it, vi } from "vitest"

import { getErrorMessage, parseAIError } from "./error"

vi.mock("~/i18n", () => ({
  getI18n: () => ({
    t: (key: string, options?: { ns?: string }) => `${options?.ns ?? "default"}:${key}`,
  }),
}))

describe("getErrorMessage", () => {
  it("shows the server's stalled-reply messages in the user's language", () => {
    expect(
      getErrorMessage(
        parseAIError(
          new Error("The AI model stopped responding, so the reply was ended. Please try again."),
        ),
      ),
    ).toBe("ai:chat.error.model_stopped_responding")
    expect(
      getErrorMessage(
        parseAIError(new Error("The reply took too long, so it was ended. Please try again.")),
      ),
    ).toBe("ai:chat.error.reply_took_too_long")
  })

  it("keeps other plain messages as they are", () => {
    expect(getErrorMessage(parseAIError(new Error("Something else went wrong")))).toBe(
      "Something else went wrong",
    )
    expect(getErrorMessage(parseAIError("constructor"))).toBe("constructor")
  })
})
