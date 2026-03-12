import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

export const useSafeSetState = <S>(
  setState: Dispatch<SetStateAction<S>>,
  unmountedRef: MutableRefObject<boolean>,
) => {
  const setSafeState = (state: S) => {
    if (!unmountedRef.current) {
      setState(state)
    }
  }
  return setSafeState
}
