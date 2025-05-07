import { isNil } from "es-toolkit/compat"
import type { CompileOptions } from "path-to-regexp"
import { compile, match, parse } from "path-to-regexp"

const CATCH_ALL_GROUP_KEY = "__catchAll__"
export function transformUriPath(uri: string): string {
  let result = ""
  const parts = uri.split("/")

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith(":")) {
      if (part.includes("{") && part.includes("}")) {
        result += `{/*${part.slice(1, part.indexOf("{"))}}`
      } else if (part.endsWith("?")) {
        result += `{/:${part.slice(1, -1)}}`
      } else {
        result += `/:${part.slice(1)}`
      }
    } else if (part === "*") {
      result += `{/:${CATCH_ALL_GROUP_KEY}}`
    } else {
      result += `/${part}`
    }
  }
  return result
}

export class MissingOptionalParamError extends Error {
  constructor(public param: string) {
    super(
      `You used the optional parameter ${param}, but there are other optional parameters before the optional parameter ${param} that you did not fill in.`,
    )
  }
}

export class MissingRequiredParamError extends Error {
  constructor(param: string) {
    super(`Missing required param ${param}`)
  }
}
export const regexpPathToPath = (
  regexpPath: string,
  params: {
    catchAll?: string
    [key: string]: string | string[] | undefined
  },
  options?: Omit<CompileOptions, "validate"> & {
    /** @default true */
    omitNilAndEmptyString?: boolean
  },
): string => {
  const nextParams = { ...params }

  const { omitNilAndEmptyString = true, ...compileConfigs } = options || {}
  if (omitNilAndEmptyString) {
    //  Delete empty string values and nil value
    for (const key in nextParams) {
      if (nextParams[key] === "" || isNil(nextParams[key])) {
        delete nextParams[key]
      }
    }
  }

  const transformedPath = transformUriPath(regexpPath)

  const paramsKeys = parseRegexpPathParams(regexpPath)
  const inputtedKeys = new Set(Object.keys(nextParams))
  let prevKeyIsOptional = false
  let prevKeyIsInputted = false
  for (const key of paramsKeys) {
    const value = nextParams[key.name]
    if (key.isCatchAll && typeof value === "string") {
      nextParams[key.name] = value.split("/")
      break
    }
    const isOptional = key.optional
    const userInputted = inputtedKeys.has(key.name)
    if (!isOptional && !userInputted) {
      throw new MissingRequiredParamError(key.name)
    }

    if (prevKeyIsOptional && !isOptional) {
      throw new Error("Required param after optional param")
    }

    if (prevKeyIsOptional && !prevKeyIsInputted && userInputted) {
      throw new MissingOptionalParamError(key.name)
    }

    prevKeyIsOptional = isOptional
    prevKeyIsInputted = userInputted
  }
  return compile(transformedPath, {
    ...compileConfigs,
  })(nextParams)
}

export type PathParams = {
  name: string
  optional: boolean
  isCatchAll: boolean
}

export type ParseRegexpPathParamsOptions = {
  excludeNames?: string[]
  forceExcludeNames?: string[]
}
export const parseRegexpPathParams = (
  regexpPath: string,
  options?: ParseRegexpPathParamsOptions,
) => {
  const { excludeNames = [], forceExcludeNames = [] } = options || {}
  const transformedPath = transformUriPath(regexpPath)
  const { tokens } = parse(transformedPath)

  return tokens
    .map((token) => {
      switch (token.type) {
        case "param": {
          return {
            name: token.name,
            optional: false,
            isCatchAll: false,
          }
        }
        case "wildcard": {
          return {
            name: token.name,
            optional: false,
            isCatchAll: true,
          }
        }
        case "group": {
          if ("name" in token.tokens[1]!) {
            return {
              name: token.tokens[1].name,
              optional: true,
              isCatchAll: token.tokens[1].type === "wildcard",
            }
          } else {
            console.warn("Invalid token", token)
            return ""
          }
        }
        default: {
          return ""
        }
      }
    })
    .filter(
      (item) =>
        typeof item === "object" &&
        "name" in item &&
        (!excludeNames.includes(item.name) || !item.optional) &&
        !forceExcludeNames.includes(item.name),
    ) as PathParams[]
}
export const parseFullPathParams = (path: string, regexpPath: string) => {
  // path: /user/123344
  // regexpPath: /user/:id
  // return {id: '123344'}
  const transformedPath = transformUriPath(regexpPath)
  const result = match(transformedPath)(path)
  if (!result) return {}
  return result.params as Record<string, string>
}
