import i18next from "i18next"
import { toast } from "sonner"
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { copyToClipboardWithFeedback } from "./clipboard"

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const writeText = vi.fn()

describe("copyToClipboardWithFeedback", () => {
  beforeAll(async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          common: { "app.copied_to_clipboard": "Copied to clipboard" },
          app: { "clipboard.copy_failed": "Unable to copy to clipboard." },
        },
      },
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  test("says the text was copied", async () => {
    writeText.mockResolvedValue(undefined)

    await copyToClipboardWithFeedback("1328554886337265664")

    expect(writeText).toHaveBeenCalledWith("1328554886337265664")
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard")
  })

  test("shows only the failure when the copy fails", async () => {
    writeText.mockRejectedValue(new Error("denied"))

    await expect(copyToClipboardWithFeedback("x")).resolves.toBeUndefined()

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.success).not.toHaveBeenCalled()
  })
})
