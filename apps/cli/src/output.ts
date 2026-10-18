import { inspect } from "node:util"

import { FollowAPIError, FollowAuthError } from "@follow-app/client-sdk"

export type OutputFormat = "json" | "table" | "plain"

export interface OutputError {
  code: string
  message: string
}

export class CLIError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "CLIError"
    this.code = code
  }
}

const stringifyJSON = (value: unknown) => {
  return JSON.stringify(
    value,
    (_key, currentValue) => {
      if (typeof currentValue === "bigint") {
        return currentValue.toString()
      }
      return currentValue
    },
    2,
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const toCellValue = (value: unknown): string | number | boolean | null => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value as string | number | boolean | null
  }
  if (value === undefined) {
    return ""
  }
  return stringifyJSON(value)
}

const toTableRow = (value: unknown): Record<string, string | number | boolean | null> => {
  if (!isRecord(value)) {
    return {
      value: toCellValue(value),
    }
  }

  const row: Record<string, string | number | boolean | null> = {}
  for (const [key, currentValue] of Object.entries(value)) {
    row[key] = toCellValue(currentValue)
  }
  return row
}

const renderAsciiTable = (
  rows: Array<Record<string, string | number | boolean | null>>,
): string => {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  // No rows, or a change the API answered with no fields
  if (columns.length === 0) {
    return "(empty)"
  }

  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => String(row[column] ?? "").length)),
  )

  const formatLine = (values: string[]) => {
    return `| ${values.map((value, index) => value.padEnd(widths[index]!)).join(" | ")} |`
  }

  const border = `+-${widths.map((width) => "-".repeat(width)).join("-+-")}-+`
  const header = formatLine(columns)
  const body = rows.map((row) => formatLine(columns.map((column) => String(row[column] ?? ""))))

  return [border, header, border, ...body, border].join("\n")
}

const renderTable = (data: unknown) => {
  if (data === null || data === undefined) {
    console.info(renderAsciiTable([]))
    return
  }
  const rows = Array.isArray(data) ? data.map(toTableRow) : [toTableRow(data)]
  console.info(renderAsciiTable(rows))
}

// Node cuts strings after 10,000 characters and arrays after 100 items by default
const plainInspectOptions = {
  depth: null,
  colors: false,
  maxStringLength: Infinity,
  maxArrayLength: Infinity,
} as const

const renderPlain = (data: unknown) => {
  if (Array.isArray(data)) {
    console.info(data.map((item) => inspect(item, plainInspectOptions)).join("\n"))
    return
  }

  if (typeof data === "string") {
    console.info(data)
    return
  }

  if (data === null || data === undefined) {
    console.info("")
    return
  }

  console.info(
    inspect(data, {
      ...plainInspectOptions,
      compact: false,
    }),
  )
}

export const printSuccess = (format: OutputFormat, data: unknown) => {
  if (format === "json") {
    const payload = {
      ok: true as const,
      // JSON.stringify drops an undefined field, and the envelope always has one
      data: data ?? null,
      error: null,
    }
    console.info(stringifyJSON(payload))
    return
  }

  if (format === "table") {
    renderTable(data)
    return
  }

  renderPlain(data)
}

export const printFailure = (format: OutputFormat, error: OutputError) => {
  if (format === "json") {
    const payload = {
      ok: false as const,
      data: null,
      error,
    }
    console.error(stringifyJSON(payload))
    return
  }

  console.error(`[${error.code}] ${error.message}`)
}

const firstLine = (message: string) => {
  const [head] = message.split("\n")
  return head?.trim() || message
}

/**
 * Why fetch could not reach a server, such as "ECONNREFUSED" or "CERT_HAS_EXPIRED: certificate
 * has expired", or undefined for any other error. Node's fetch only says "fetch failed" and
 * keeps the reason in `cause`.
 */
export const describeFetchFailure = (error: unknown): string | undefined => {
  if (!(error instanceof TypeError) || error.message !== "fetch failed") {
    return undefined
  }

  const { cause } = error
  if (typeof cause !== "object" || cause === null) {
    return "network error"
  }
  const reason = cause as { code?: unknown; message?: unknown }
  const code = typeof reason.code === "string" ? reason.code : undefined
  const message = typeof reason.message === "string" && reason.message ? reason.message : undefined
  if (code && message && !message.includes(code)) {
    return `${code}: ${message}`
  }
  return message ?? code ?? "network error"
}

/** A NETWORK_ERROR naming the API when fetch could not reach it, undefined for other errors */
export const toNetworkError = (error: unknown, apiUrl?: string): OutputError | undefined => {
  const reason = describeFetchFailure(error)
  if (!reason) {
    return undefined
  }
  return {
    code: "NETWORK_ERROR",
    message: apiUrl
      ? `Cannot reach the API at ${apiUrl} (${reason}).`
      : `Cannot reach the API (${reason}).`,
  }
}

export const normalizeError = (
  error: unknown,
  { verbose = false, apiUrl }: { verbose?: boolean; apiUrl?: string } = {},
): OutputError => {
  if (error instanceof CLIError) {
    return {
      code: error.code,
      message: error.message,
    }
  }

  const networkError = toNetworkError(error, apiUrl)
  if (networkError) {
    return networkError
  }

  if (error instanceof FollowAuthError) {
    return {
      code: "UNAUTHORIZED",
      message: verbose ? error.message : firstLine(error.message),
    }
  }

  if (error instanceof FollowAPIError) {
    return {
      code: error.code ?? `HTTP_${error.status}`,
      message: verbose ? error.message : firstLine(error.message),
    }
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred",
  }
}
