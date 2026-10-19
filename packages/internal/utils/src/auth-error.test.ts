import { describe, expect, it } from "vitest"

import {
  describeAuthError,
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
    expect(getAuthErrorMessageKey("INVALID_EMAIL_OR_PASSWORD")).toBe(
      "auth.error.invalid_email_or_password",
    )
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

describe("describeAuthError", () => {
  const translate = (key: string) => `translated ${key}`

  it("translates the auth server's rate limit, with or without its code", () => {
    expect(
      describeAuthError(
        {
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
          status: 429,
        },
        translate,
      ),
    ).toBe("translated auth.error.too_many_requests")
    expect(describeAuthError({ status: 429, statusText: "Too Many Requests" }, translate)).toBe(
      "translated auth.error.too_many_requests",
    )
  })

  it("translates a password sign-in the server refused for the email or the password", () => {
    expect(
      describeAuthError(
        { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password", status: 401 },
        translate,
      ),
    ).toBe("translated auth.error.invalid_email_or_password")
  })

  it("keeps what the server said about anything else", () => {
    expect(
      describeAuthError(
        { code: "USER_ALREADY_EXISTS", message: "User already exists", status: 422 },
        translate,
      ),
    ).toBe("User already exists")
    expect(describeAuthError({ status: 500, statusText: "Internal Server Error" }, translate)).toBe(
      "Internal Server Error",
    )
  })
})
