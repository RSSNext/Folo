import { describe, expect, it } from "vitest"

import {
  getAuthErrorMessageKey,
  readAuthRedirectError,
  withoutAuthRedirectError,
} from "./auth-error"

describe("getAuthErrorMessageKey", () => {
  it("names the message of a refusal the server explains", () => {
    expect(getAuthErrorMessageKey("TWO_FACTOR_REQUIRED")).toBe("auth.error.two_factor_required")
    expect(getAuthErrorMessageKey("INVALID_TOKEN")).toBe("auth.error.invalid_token")
    expect(getAuthErrorMessageKey("TOKEN_EXPIRED")).toBe("auth.error.invalid_token")
    expect(getAuthErrorMessageKey("account_not_linked")).toBe("auth.error.account_not_linked")
  })

  it("names none for any other code", () => {
    expect(getAuthErrorMessageKey("state_mismatch")).toBeUndefined()
    expect(getAuthErrorMessageKey("toString")).toBeUndefined()
    expect(getAuthErrorMessageKey(undefined)).toBeUndefined()
    expect(getAuthErrorMessageKey(401)).toBeUndefined()
  })
})

describe("the error a sign-in came back with", () => {
  it("is read from the query", () => {
    expect(readAuthRedirectError("?error=TWO_FACTOR_REQUIRED")).toBe("TWO_FACTOR_REQUIRED")
    expect(readAuthRedirectError("?view=1&error=account_not_linked")).toBe("account_not_linked")
    expect(readAuthRedirectError("?error=")).toBeNull()
    expect(readAuthRedirectError("")).toBeNull()
  })

  it("is taken out of the query with its description, keeping the rest", () => {
    expect(withoutAuthRedirectError("?error=INVALID_TOKEN")).toBe("")
    expect(
      withoutAuthRedirectError(
        "?cli_callback=http%3A%2F%2F127.0.0.1%3A9&error=x&error_description=y",
      ),
    ).toBe("?cli_callback=http%3A%2F%2F127.0.0.1%3A9")
  })
})
