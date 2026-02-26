import { atom, useStore } from 'jotai'
import type { FC, JSX, PropsWithChildren } from 'react'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Drawer } from 'vaul'

export interface PresentSheetProps {
  content: JSX.Element | FC
  open?: boolean
  onOpenChange?: (value: boolean) => void
  title?: string
  zIndex?: number
  dismissible?: boolean
}

export const sheetStackAtom = atom([] as HTMLDivElement[])

export const PresentSheet: FC<PropsWithChildren<PresentSheetProps>> = (
  props,
) => {
  const { content, children, zIndex = 998, title, dismissible = true } = props
  const nextRootProps = useMemo(() => {
    const nextProps = {} as any
    if (props.open !== undefined) {
      nextProps.open = props.open
    }

    if (props.onOpenChange !== undefined) {
      nextProps.onOpenChange = props.onOpenChange
    }

    return nextProps
  }, [props])
  const [holderRef, setHolderRef] = useState<HTMLDivElement | null>()
  const store = useStore()

  useEffect(() => {
    const holder = holderRef
    if (!holder) return
    store.set(sheetStackAtom, (p) => {
      return p.concat(holder)
    })

    return () => {
      store.set(sheetStackAtom, (p) => {
        return p.filter((item) => item !== holder)
      })
    }
  }, [holderRef, store])

  const { Root } = Drawer

  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  return (
    <Root dismissible={dismissible} {...nextRootProps}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Content
          style={{
            zIndex: contentZIndex,
          }}
          className="bg-background flex fixed inset-x-0 bottom-0 mt-24 max-h-[95vh] flex-col rounded-t-[10px] p-4"
        >
          {dismissible && (
            <div className="mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-neutral-800" />
          )}

          {title && <Drawer.Title>{title}</Drawer.Title>}

          {React.isValidElement(content)
            ? content
            : typeof content === 'function'
              ? React.createElement(content)
              : null}
          <div ref={setHolderRef} />
        </Drawer.Content>
        <Drawer.Overlay
          className="fixed inset-0 bg-neutral-800/40"
          style={{
            zIndex: overlayZIndex,
          }}
        />
      </Drawer.Portal>
    </Root>
  )
}
