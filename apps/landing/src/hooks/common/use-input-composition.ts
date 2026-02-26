import type { CompositionEventHandler } from 'react'
import { useCallback, useEffect, useRef } from 'react'

type InputElementAttributes = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>
type TextareaElementAttributes = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>
export const useInputComposition = <E = HTMLInputElement>(
  props: Pick<
    E extends HTMLInputElement
      ? InputElementAttributes
      : E extends HTMLTextAreaElement
        ? TextareaElementAttributes
        : never,
    'onKeyDown' | 'onCompositionEnd' | 'onCompositionStart' | 'onKeyDownCapture'
  >,
) => {
  const { onKeyDown, onCompositionStart, onCompositionEnd } = props

  const isCompositionRef = useRef(false)

  const currentInputTargetRef = useRef<E | null>(null)

  const handleCompositionStart: CompositionEventHandler<E> = useCallback(
    (e) => {
      currentInputTargetRef.current = e.target as E

      isCompositionRef.current = true
      onCompositionStart?.(e as any)
    },
    [onCompositionStart],
  )

  const handleCompositionEnd: CompositionEventHandler<E> = useCallback(
    (e) => {
      currentInputTargetRef.current = null
      isCompositionRef.current = false
      onCompositionEnd?.(e as any)
    },
    [onCompositionEnd],
  )

  const handleKeyDown: React.KeyboardEventHandler<E> = useCallback(
    (e: any) => {
      // The keydown event stop emit when the composition is being entered
      if (isCompositionRef.current) {
        e.stopPropagation()
        return
      }
      onKeyDown?.(e)

      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()

        if (!isCompositionRef.current) {
          e.currentTarget.blur()
        }
      }
    },
    [onKeyDown],
  )

  // Register a global capture keydown listener to prevent the radix `useEscapeKeydown` from working
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentInputTargetRef.current) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true })

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, {
        capture: true,
      })
    }
  }, [])

  const ret = {
    onCompositionEnd: handleCompositionEnd,
    onCompositionStart: handleCompositionStart,
    onKeyDown: handleKeyDown,
  }
  Object.defineProperty(ret, 'isCompositionRef', {
    value: isCompositionRef,
    enumerable: false,
  })
  return ret as typeof ret & {
    isCompositionRef: typeof isCompositionRef
  }
}
