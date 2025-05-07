import { useCallback } from "react"

export const useTypeScriptHappyCallback: <Args extends unknown[], R>(
  fn: (...args: Args) => R,
  deps: React.DependencyList,
) => (...args: Args) => R = useCallback
