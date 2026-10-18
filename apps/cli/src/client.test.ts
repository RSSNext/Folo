import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchAuthSession, resolveApiUrl } from "./client"
import { CLIError } from "./output"

afterEach(() => {
  vi.unstubAllGlobals()
})

const stubFetch = (response: Response) => {
  const requests: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requests.push(url)
      return response
    }),
  )
  return requests
}

describe("resolveApiUrl", () => {
  it("drops trailing slashes", () => {
    expect(resolveApiUrl("http://localhost:3000/")).toBe("http://localhost:3000")
    expect(resolveApiUrl(" https://api.folo.is// ")).toBe("https://api.folo.is")
    expect(resolveApiUrl("https://api.folo.is")).toBe("https://api.folo.is")
  })

  it("rejects values that are not http URLs", () => {
    expect(() => resolveApiUrl("not-a-url")).toThrowError(
      new CLIError("INVALID_ARGUMENT", "Invalid API URL: not-a-url"),
    )
    expect(() => resolveApiUrl("ftp://api.folo.is")).toThrowError(/Use an http or https URL/)
  })
})

describe("fetchAuthSession", () => {
  const session = { user: { id: "user1" }, session: { id: "session1" } }

  it("asks the API for the session of the token", async () => {
    const requests = stubFetch(Response.json(session))

    await expect(fetchAuthSession({ apiUrl: "http://api.test", token: "token" })).resolves.toEqual(
      session,
    )
    expect(requests).toEqual(["http://api.test/better-auth/get-session"])
  })

  it.each([401, 403])("reports HTTP %i as an unauthorized token", async (status) => {
    stubFetch(Response.json({ message: "Invalid session" }, { status }))

    await expect(
      fetchAuthSession({ apiUrl: "http://api.test", token: "token" }),
    ).rejects.toThrowError(new CLIError("UNAUTHORIZED", "Invalid session"))
  })

  // An unknown or revoked session is answered with 200 and a null body
  it.each([null, {}, { user: null, session: null }])(
    "reports a session answered as %j as an unauthorized token",
    async (body) => {
      stubFetch(Response.json(body))

      await expect(
        fetchAuthSession({ apiUrl: "http://api.test", token: "token" }),
      ).rejects.toThrowError(new CLIError("UNAUTHORIZED", "Token is invalid or expired."))
    },
  )

  it("does not blame the token for other failures", async () => {
    stubFetch(new Response("404 Not Found", { status: 404 }))

    const error = await fetchAuthSession({ apiUrl: "http://api.test", token: "token" }).catch(
      (error: unknown) => error,
    )
    expect(error).toBeInstanceOf(CLIError)
    expect(error).toMatchObject({ code: "HTTP_404", message: "404 Not Found" })
  })
})
