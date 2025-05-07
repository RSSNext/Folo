import { useSetAtom } from "jotai"
import { useCallback } from "react"

import { loadingAtom, loadingVisibleAtom } from "../atoms/app"

export const useLoadingCallback = () => {
  const setLoadingCaller = useSetAtom(loadingAtom)
  const setVisible = useSetAtom(loadingVisibleAtom)

  return useCallback(
    (
      thenable: Promise<any>,
      options: Partial<{
        finish: () => any
        cancel: () => any
        done: (r: unknown) => any
        error: (err: any) => any
      }>,
    ) => {
      setLoadingCaller({
        thenable,
        finish: options.finish,
        cancel: options.cancel,
        done: options.done,
        error: options.error,
      })
      setVisible(true)
    },
    [setLoadingCaller, setVisible],
  )
}
