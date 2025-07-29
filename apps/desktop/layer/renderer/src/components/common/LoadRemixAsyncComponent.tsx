import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import type { FC, ReactNode } from "react"
import { createElement, useEffect, useState } from "react"

export const LoadRemixAsyncComponent: FC<{
  loader: () => Promise<any>
  Header: FC<{ loader: () => any; [key: string]: any }>
}> = ({ loader, Header }) => {
  const [loading, setLoading] = useState(true)

  const [Component, setComponent] = useState<{ c: () => ReactNode }>({
    c: () => null,
  })

  useEffect(() => {
    let isUnmounted = false
    setLoading(true)
    loader()
      .then((module) => {
        if (!module.Component) {
          return
        }
        if (isUnmounted) return

        const { loader } = module
        setComponent({
          c: () => (
            <>
              <Header loader={loader} />
              <module.Component />
            </>
          ),
        })
      })
      .finally(() => {
        setLoading(false)
      })
    return () => {
      isUnmounted = true
    }
  }, [Header, loader])

  if (loading) {
    return (
      <div className="center absolute inset-0 h-full">
        <LoadingCircle size="large" />
      </div>
    )
  }

  return createElement(Component.c)
}
