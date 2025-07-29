/* eslint-disable react-refresh/only-export-components */
import { useOnce, useTypeScriptHappyCallback } from "@follow/hooks"
import type { FC } from "react"
import { createContext, createElement, use } from "react"
import { useEventCallback } from "usehooks-ts"

import type { ModalActionsInternal } from "~/components/ui/modal"
import type { UseAsyncFetcher } from "~/components/ui/modal/stacked/AsyncModalContent"
import { AsyncModalContent } from "~/components/ui/modal/stacked/AsyncModalContent"
import { NoopChildren } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

export type AsyncModalOptions<T> = {
  id: string
  title: ((data: T) => string) | string
  icon?: (data: T) => React.ReactNode
  useDataFetcher: () => UseAsyncFetcher<T>
  content: FC<ModalActionsInternal & { data: T }>

  // Modal options
  overlay?: boolean
  clickOutsideToDismiss?: boolean
}
const AsyncModalContext = createContext<AsyncModalOptions<any>>(null!)
export const useAsyncModal = () => {
  const { present } = useModalStack()

  return useEventCallback(<T,>(options: AsyncModalOptions<T>) => {
    present({
      id: options.id,
      content: () => (
        <AsyncModalContext value={options}>
          <LazyContent />
        </AsyncModalContext>
      ),
      title: "Loading...",
      CustomModalComponent: NoopChildren,
      overlay: options.overlay,
    })
  })
}

const LazyContent = () => {
  const ctx = use(AsyncModalContext)
  const queryResult = ctx.useDataFetcher()

  return (
    <AsyncModalContent
      queryResult={queryResult}
      renderContent={useTypeScriptHappyCallback(
        (data) => (
          <Presentable data={data} />
        ),
        [],
      )}
    />
  )
}

const Presentable: FC<{
  data: any
}> = ({ data }) => {
  const { present, dismissTop } = useModalStack()
  const ctx = use(AsyncModalContext)

  useOnce(() => {
    dismissTop()
    present({
      id: `presentable-${ctx.id}`,
      content: (props) => createElement(ctx.content, { data, ...props }),
      title: typeof ctx.title === "function" ? ctx.title(data) : ctx.title,
      icon: ctx.icon?.(data),
      clickOutsideToDismiss: ctx.clickOutsideToDismiss,
    })
  })
  return null
}
