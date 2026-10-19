import { vi } from "vitest"

import { runCLI } from "./program"

export interface APIRequest {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

/** Answers a request with a Response, or with the body of a JSON response */
export type APIHandler = (request: APIRequest) => unknown

const toRequest = (input: string | URL | Request, init?: RequestInit): APIRequest => {
  const url = new URL(input instanceof Request ? input.url : input)
  return {
    method: init?.method ?? "GET",
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
  }
}

/**
 * Runs the CLI with a token against an API that `handler` answers and collects what it
 * printed. Test files mock "./config" themselves so that the user's config stays out of it.
 */
export const runCLIWithAPI = async (args: string[], handler: APIHandler) => {
  const requests: APIRequest[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const request = toRequest(input, init)
      requests.push(request)
      const answer = await handler(request)
      return answer instanceof Response ? answer : Response.json(answer)
    }),
  )
  const stdout = vi.spyOn(console, "info").mockImplementation(() => {})
  const stderr = vi.spyOn(console, "error").mockImplementation(() => {})

  await runCLI(["node", "folo", "--api-url", "http://api.test", "--token", "token", ...args])

  const result = {
    requests,
    stdout: stdout.mock.calls.map(([line]) => String(line)).join("\n"),
    stderr: stderr.mock.calls.map(([line]) => String(line)).join("\n"),
    exitCode: process.exitCode,
  }
  stdout.mockRestore()
  stderr.mockRestore()
  vi.unstubAllGlobals()
  process.exitCode = undefined
  return result
}

/** The JSON envelope a command printed */
export const parseEnvelope = <T = unknown>(output: string) =>
  JSON.parse(output) as
    | { ok: true; data: T; error: null }
    | { ok: false; data: null; error: { code: string; message: string } }
