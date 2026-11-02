import type { ExecFileException } from "node:child_process"
import { execFile } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import { promisify } from "node:util"

import { resolve } from "pathe"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const cliPath = resolve(process.cwd(), "dist/index.js")
const testToken = process.env.FOLO_TEST_TOKEN
const isolatedHome = mkdtempSync(resolve(tmpdir(), "folocli-test-"))

type CLIExecution = {
  code: number
  stdout: string
  stderr: string
}

const runCLI = async (args: string[]): Promise<CLIExecution> => {
  try {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, ...args], {
      env: {
        ...process.env,
        HOME: isolatedHome,
        USERPROFILE: isolatedHome,
        FOLO_TOKEN: "",
      },
    })

    return {
      code: 0,
      stdout,
      stderr,
    }
  } catch (error) {
    const execError = error as ExecFileException & {
      stdout?: string
      stderr?: string
    }

    return {
      code: typeof execError.code === "number" ? execError.code : 1,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? "",
    }
  }
}

/** A local port nothing listens on, so connecting to it is refused */
const getClosedPort = async () => {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address() as AddressInfo
  await new Promise((resolve) => server.close(resolve))
  return port
}

describe("cli e2e", () => {
  it("exits right after reporting an API it cannot reach", async () => {
    const apiUrl = `http://127.0.0.1:${await getClosedPort()}`
    const startedAt = Date.now()
    const result = await runCLI(["--api-url", apiUrl, "--token", "token", "timeline"])

    // The SDK's request timeout used to keep the process alive for 30 s
    expect(Date.now() - startedAt).toBeLessThan(10_000)
    expect(result.code).toBe(1)
    expect(JSON.parse(result.stderr)).toMatchObject({
      ok: false,
      error: { code: "NETWORK_ERROR", message: expect.stringContaining(apiUrl) },
    })
  }, 40_000)

  it("returns structured unauthorized error without token", async () => {
    const result = await runCLI(["timeline", "--limit", "1"])
    expect(result.code).not.toBe(0)

    const payload = JSON.parse(result.stderr) as {
      ok: boolean
      data: null
      error: { code: string; message: string }
    }
    expect(payload.ok).toBe(false)
    expect(payload.data).toBeNull()
    expect(payload.error.code).toBe("UNAUTHORIZED")
  })

  it.runIf(Boolean(testToken))("can fetch session with test token", async () => {
    const result = await runCLI(["--token", testToken!, "whoami"])
    expect(result.code).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      data: {
        user: { id: string }
        session: { id: string }
      }
      error: null
    }
    expect(payload.ok).toBe(true)
    expect(payload.error).toBeNull()
    expect(typeof payload.data.user.id).toBe("string")
    expect(typeof payload.data.session.id).toBe("string")
  })

  it.runIf(Boolean(testToken))("can fetch timeline with test token", async () => {
    const result = await runCLI(["--token", testToken!, "timeline", "--limit", "1"])
    expect(result.code).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      data: {
        entries: unknown[]
        nextCursor: string | null
        hasNext: boolean
      }
      error: null
    }
    expect(payload.ok).toBe(true)
    expect(Array.isArray(payload.data.entries)).toBe(true)
    expect(typeof payload.data.hasNext).toBe("boolean")
  })
})
