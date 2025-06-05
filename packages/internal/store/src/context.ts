import type { AuthClient } from "@follow/shared/auth"

import type { APIClient } from "./types"

const NO_VALUE_DEFAULT = Symbol("NO_VALUE_DEFAULT")
type ContextValue<T> = T | typeof NO_VALUE_DEFAULT

function createSimpleContext<T>() {
  let contextValue: ContextValue<T> = NO_VALUE_DEFAULT

  const provide = (value: T) => {
    contextValue = value
  }

  const consumer = (): T => {
    if (contextValue === NO_VALUE_DEFAULT) {
      throw new TypeError("You should only use this context value inside a provider.")
    }
    return contextValue
  }

  return {
    provide,
    consumer,
  }
}

export const apiClientSimpleContext = createSimpleContext<APIClient>()
export const authClientSimpleContext = createSimpleContext<AuthClient>()
export const apiClient = apiClientSimpleContext.consumer
export const authClient = authClientSimpleContext.consumer
