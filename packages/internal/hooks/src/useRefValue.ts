import { useLayoutEffect, useRef } from "react"

export const useRefValue = <S>(
  value: S,
): Readonly<{
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  current: S extends Function ? S : Readonly<S>
}> => {
  const ref = useRef<S>(value)

  useLayoutEffect(() => {
    ref.current = value
  }, [value])
  return ref as any
}
