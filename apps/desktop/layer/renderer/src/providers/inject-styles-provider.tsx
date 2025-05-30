import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FC, PropsWithChildren } from "react"
import { createContext, use, useCallback, useState } from "react"

const Provider = createContext<(id: string, styles: string) => () => void>(() => () => {})
export const PortalInjectStylesProvider: FC<PropsWithChildren> = ({ children }) => {
  const [styles, setStyles] = useState({} as Record<string, string>)

  const injectStyles = useCallback((id: string, styles: string) => {
    const dispose = () => {
      setStyles((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
    }
    if (styles[id]) return dispose
    setStyles((prev) => ({ ...prev, [id]: styles }))

    return dispose
  }, [])
  return (
    <Provider value={injectStyles}>
      <RootPortal to={document.head}>
        {Object.entries(styles).map(([id, style]) => (
          <MemoedDangerousHTMLStyle key={id} id={`inject-${id}`}>
            {style}
          </MemoedDangerousHTMLStyle>
        ))}
      </RootPortal>
      {children}
    </Provider>
  )
}

export const useInjectStyles = () => {
  return use(Provider)
}
