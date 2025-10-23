import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import type { FC } from "react"
import { useNavigate } from "react-router"

import { CustomSafeError } from "../../errors/CustomSafeError"
import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { useResetErrorWhenRouteChange } from "./helper"

const EntryNotFoundErrorFallback: FC<AppErrorFallbackProps> = ({ resetError, error }) => {
  if (!(error instanceof EntryNotFound)) {
    throw error
  }

  useResetErrorWhenRouteChange(resetError)
  const navigate = useNavigate()
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center rounded-md bg-theme-background p-2">
      <div className="center m-auto flex max-w-prose flex-col gap-4 text-center">
        <div className="center mb-8 flex">
          <Logo className="size-20" />
        </div>
        <p className="font-semibold">
          The entry you're looking for could not be found. It may have been removed or the URL is
          incorrect.
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
export default EntryNotFoundErrorFallback

export class EntryNotFound extends CustomSafeError {
  constructor() {
    super("Entry 404")
  }
}
