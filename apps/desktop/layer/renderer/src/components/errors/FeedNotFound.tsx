import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import type { FC } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md bg-theme-background p-2">
      <div className="center m-auto flex max-w-prose flex-col gap-4 text-center">
        <div className="center mb-8 flex">
          <Logo className="size-20" />
        </div>
        <p className="font-semibold">{t("errors_page.feed_not_found")}</p>

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
            {t("words.back", { ns: "common" })}
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
