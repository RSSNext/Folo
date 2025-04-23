import { Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { stopPropagation } from "@follow/utils/dom"
import { m } from "motion/react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { createErrorToaster } from "~/lib/error-parser"

export interface UseAsyncFetcher<T> {
  data: Nullable<T>
  error: Nullable<Error>
  isLoading: boolean
  refetch: () => void
}
interface AsyncModalContentProps<T> {
  queryResult: UseAsyncFetcher<T>
  renderContent: (data: T) => React.ReactNode
  loadingComponent?: React.ReactNode
}

function useCountdown(durationInSeconds: number): boolean {
  const [isFinished, setIsFinished] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsFinished(true)
    }, durationInSeconds * 1000)

    return () => clearTimeout(timer)
  }, [durationInSeconds])

  return isFinished
}

export function AsyncModalContent<T>({
  queryResult,
  renderContent,
  loadingComponent,
}: AsyncModalContentProps<T>) {
  const { data, isLoading, error, refetch } = queryResult
  const { dismiss } = useCurrentModal()

  const shouldShowCloseButton = useCountdown(2)
  React.useEffect(() => {
    if (error) {
      createErrorToaster()(error)
    }
  }, [error])
  const { t } = useTranslation("common")

  if (isLoading || !data) {
    return (
      loadingComponent || (
        <div className="center absolute inset-0 flex-col gap-8">
          <LoadingCircle size="large" />
          <m.div
            exit={{
              opacity: 0,
            }}
            className="flex items-center gap-3"
            onFocusCapture={stopPropagation}
          >
            {!!error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    buttonClassName="p-2 rounded-full"
                    layout
                  >
                    <i className="i-mgc-refresh-2-cute-re" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("retry")}</TooltipContent>
              </Tooltip>
            )}
            {(shouldShowCloseButton || !!error) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={dismiss}
                    variant="outline"
                    buttonClassName="p-2 rounded-full"
                    layout
                  >
                    <i className="i-mgc-close-cute-re" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("words.close")}</TooltipContent>
              </Tooltip>
            )}
          </m.div>
        </div>
      )
    )
  }

  if (error) {
    return null // Error is already handled by the toaster
  }

  return renderContent(data)
}
