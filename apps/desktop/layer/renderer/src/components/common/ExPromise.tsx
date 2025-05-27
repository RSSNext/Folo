import { useLayoutEffect, useState } from "react"
import type { JSX } from "react/jsx-runtime"

const NOT_RESOLVED = Symbol("NOT_RESOLVED")
export const ExPromise = <T,>({
  children,
  promise,
}: {
  promise: Promise<T>
  children: (value: T) => JSX.Element
}) => {
  // use() is a hook that returns the value of the promise, but in react 19

  const [value, setValue] = useState<T | symbol>(NOT_RESOLVED)
  useLayoutEffect(() => {
    promise.then(setValue)
  }, [promise])

  return value === NOT_RESOLVED ? null : children(value as T)
}
