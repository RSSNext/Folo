import { inspect } from "node:util"

import type { FollowAPIErrorRequest } from "@follow-app/client-sdk"
import { FollowAPIError, FollowAuthError } from "@follow-app/client-sdk"

export type OutputFormat = "json" | "table" | "plain"

export interface OutputError {
  code: string
  message: string
  /** With --verbose, what a request the API refused asked for. It never holds the headers. */
  request?: FollowAPIErrorRequest
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

type Cell = string | number | boolean | null
type TableRow = Record<string, Cell>

const isScalar = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value !== "object" && typeof value !== "function")

/** The longest a cell gets, in terminal columns */
const MAX_CELL_WIDTH = 60

// Characters terminals draw two columns wide: CJK, Hangul, fullwidth forms and most emoji
const WIDE_CHARACTER =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u{1F300}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{20000}-\u{3FFFD}]/u

const getCharacterWidth = (character: string) => (WIDE_CHARACTER.test(character) ? 2 : 1)

const getDisplayWidth = (text: string) => {
  let width = 0
  for (const character of text) {
    width += getCharacterWidth(character)
  }
  return width
}

/** Text on one line, cut to MAX_CELL_WIDTH columns */
const toLine = (text: string) => {
  const line = text.replaceAll(/\s+/g, " ").trim()
  if (getDisplayWidth(line) <= MAX_CELL_WIDTH) {
    return line
  }

  let cut = ""
  let width = 0
  for (const character of line) {
    width += getCharacterWidth(character)
    if (width > MAX_CELL_WIDTH - 1) {
      break
    }
    cut += character
  }
  return `${cut}…`
}

/** A value in one cell: scalars as they are, lists joined, objects by their title, name or id */
const toCell = (value: unknown): Cell => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }
  if (Array.isArray(value)) {
    return value.every((item) => isScalar(item))
      ? toLine(value.map((item) => String(item ?? "")).join(", "))
      : `${value.length} ${value.length === 1 ? "item" : "items"}`
  }
  if (isRecord(value)) {
    const name = [value.title, value.name, value.id].find(
      (item): item is string => typeof item === "string" && item.length > 0,
    )
    return toLine(
      name ??
        JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)),
    )
  }
  return toLine(String(value))
}

const toTableRow = (value: unknown): TableRow => {
  if (!isRecord(value)) {
    return { value: toCell(value) }
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toCell(item)]))
}

/** The fields of a record as rows, nested records as dotted paths such as user.name */
const toFieldRows = (record: Record<string, unknown>, prefix = "", depth = 0): TableRow[] =>
  Object.entries(record).flatMap(([key, value]) => {
    const field = prefix ? `${prefix}.${key}` : key
    // Left out like JSON leaves it out
    if (value === undefined) {
      return []
    }
    return isRecord(value) && Object.keys(value).length > 0 && depth < 2
      ? toFieldRows(value, field, depth + 1)
      : [{ field, value: toCell(value) }]
  })

interface TableView {
  rows: TableRow[]
  /** Fields of a result shown below the rows of its list, such as the cursor of the next page */
  footer: Array<[string, Cell]>
}

const toTableView = (data: unknown): TableView => {
  if (data === null || data === undefined) {
    return { rows: [], footer: [] }
  }
  if (Array.isArray(data)) {
    return { rows: data.map(toTableRow), footer: [] }
  }
  if (!isRecord(data)) {
    return { rows: [toTableRow(data)], footer: [] }
  }

  const fields = Object.entries(data)
  const lists = fields.filter((field): field is [string, unknown[]] => Array.isArray(field[1]))
  const others = fields.filter(([, value]) => !Array.isArray(value))

  // A page of a list, such as { entries, nextCursor, hasNext }: a row per item
  const [list] = lists
  if (list && lists.length === 1 && others.every(([, value]) => isScalar(value))) {
    return {
      rows: list[1].map(toTableRow),
      footer: others.map(([key, value]) => [key, toCell(value)]),
    }
  }

  // A flat result, such as { count }: one row
  if (fields.every(([, value]) => isScalar(value))) {
    return { rows: [toTableRow(data)], footer: [] }
  }

  // A detail, such as the session of whoami: a row per field
  return { rows: toFieldRows(data), footer: [] }
}

const formatCell = (value: Cell | undefined) =>
  value === null || value === undefined ? "" : String(value)

const renderAsciiTable = (rows: TableRow[]): string => {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  // No rows, or a change the API answered with no fields
  if (columns.length === 0) {
    return "(empty)"
  }

  const widths = columns.map((column) =>
    Math.max(
      getDisplayWidth(column),
      ...rows.map((row) => getDisplayWidth(formatCell(row[column]))),
    ),
  )

  const formatLine = (values: string[]) => {
    const cells = values.map(
      (value, index) => `${value}${" ".repeat(widths[index]! - getDisplayWidth(value))}`,
    )
    return `| ${cells.join(" | ")} |`
  }

  const border = `+-${widths.map((width) => "-".repeat(width)).join("-+-")}-+`
  const header = formatLine(columns)
  const body = rows.map((row) => formatLine(columns.map((column) => formatCell(row[column]))))

  return [border, header, border, ...body, border].join("\n")
}

const renderTable = (data: unknown) => {
  const { rows, footer } = toTableView(data)
  console.info(
    [renderAsciiTable(rows), ...footer.map(([key, value]) => `${key}: ${formatCell(value)}`)].join(
      "\n",
    ),
  )
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

/** The request of a failed call as lines of text: its method and path, then what it sent */
const formatRequest = ({ method, path, originalPath, query, body }: FollowAPIErrorRequest) => {
  const lines = [
    `Request: ${method} ${path}${originalPath && originalPath !== path ? ` (original: ${originalPath})` : ""}`,
  ]
  if (query !== undefined) {
    lines.push(`Query: ${stringifyJSON(query)}`)
  }
  if (body !== undefined) {
    lines.push(`Body: ${stringifyJSON(body)}`)
  }
  return lines.join("\n")
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
  if (error.request) {
    console.error(formatRequest(error.request))
  }
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

/**
 * An INVALID_RESPONSE for an answer the Folo API never gives, such as the page a web app
 * answers every path with: the API URL names something else, and the token is not to blame.
 */
export const toInvalidResponseError = (apiUrl: string, answer: string) =>
  new CLIError("INVALID_RESPONSE", `The server at ${apiUrl} ${answer}. Check --api-url.`)

/**
 * The JSON body of a successful answer. The API answers its auth endpoints with JSON, even a
 * session it does not know with `null`.
 */
export const readJSONBody = async (response: Response, apiUrl: string): Promise<unknown> => {
  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw toInvalidResponseError(apiUrl, "answered with something other than JSON")
  }
}

/**
 * Without an error from the API in the body, as from a server that is not the API, the SDK
 * names the error by its HTTP status. That reads like one of the API's own codes, which are
 * never HTTP statuses, so it is reported as `HTTP_<status>`, as the session check reports it.
 */
const toAPIErrorCode = (error: FollowAPIError) =>
  !error.code || error.code === String(error.status) ? `HTTP_${error.status}` : error.code

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

  if (error instanceof FollowAPIError) {
    const code = error instanceof FollowAuthError ? "UNAUTHORIZED" : toAPIErrorCode(error)
    return verbose && error.request
      ? { code, message: error.message, request: error.request }
      : { code, message: error.message }
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
