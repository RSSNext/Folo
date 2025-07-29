import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import type { FC } from "react"
import { useNavigate } from "react-router"

import { CustomSafeError } from "../../errors/CustomSafeError"
import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { useResetErrorWhenRouteChange } from "./helper"

const FeedNotFoundErrorFallback: FC<AppErrorFallbackProps> = ({ resetError, error }) => {
  if (!(error instanceof FeedNotFound)) {
    throw error
  }

  useResetErrorWhenRouteChange(resetError)
  const navigate = useNavigate()
  return (
    <div className="bg-theme-background flex w-full flex-col items-center justify-center rounded-md p-2">
      <div className="center m-auto flex max-w-prose flex-col gap-4 text-center">
        <div className="center mb-8 flex">
          <Logo className="size-20" />
        </div>
        <p className="font-semibold">
          There is no feed with the given ID. Please check the URL and retry.
        </p>

        <div className="center mt-12 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              navigate("/")
              setTimeout(() => {
                resetError()
              }, 100)
            }}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
export default FeedNotFoundErrorFallback

export class FeedNotFound extends CustomSafeError {
  constructor() {
    super("Feed 404")
  }
}
