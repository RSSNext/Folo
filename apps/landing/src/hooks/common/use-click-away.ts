/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// @copy https://github.com/streamich/react-use/blob/master/src/useClickAway.ts
import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

function on<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args: Parameters<T['addEventListener']> | [string, Function | null, ...any]
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(
      ...(args as Parameters<HTMLElement['addEventListener']>),
    )
  }
}

function off<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args:
    | Parameters<T['removeEventListener']>
    | [string, Function | null, ...any]
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(
      ...(args as Parameters<HTMLElement['removeEventListener']>),
    )
  }
}

const defaultEvents = ['mousedown', 'touchstart']

const useClickAway = <E extends Event = Event>(
  ref: RefObject<HTMLElement | null>,
  onClickAway: (event: E) => void,
  events: string[] = defaultEvents,
) => {
  const savedCallback = useRef(onClickAway)
  useEffect(() => {
    savedCallback.current = onClickAway
  }, [onClickAway])
  useEffect(() => {
    const handler = (event: React.MouseEvent) => {
      const { current: el } = ref
      el &&
        !el.contains(event.target as any) &&
        savedCallback.current(event as any)
    }
    for (const eventName of events) {
      on(document, eventName, handler)
    }
    return () => {
      for (const eventName of events) {
        off(document, eventName, handler)
      }
    }
  }, [events, ref])
}

export default useClickAway
