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
  if (rows.length === 0) {
    return "(empty)"
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
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
  const rows = Array.isArray(data) ? data.map(toTableRow) : [toTableRow(data)]
  console.info(renderAsciiTable(rows))
}

const renderPlain = (data: unknown) => {
  if (Array.isArray(data)) {
    console.info(data.map((item) => inspect(item, { depth: null, colors: false })).join("\n"))
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
      depth: null,
      colors: false,
      compact: false,
    }),
  )
}

export const printSuccess = (format: OutputFormat, data: unknown) => {
  if (format === "json") {
    const payload = {
      ok: true as const,
      data,
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

export const normalizeError = (error: unknown, verbose = false): OutputError => {
  if (error instanceof CLIError) {
    return {
      code: error.code,
      message: error.message,
    }
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
