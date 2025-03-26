import { Button } from "@follow/components/ui/button/index.js"
import type { FeedModel } from "@follow/models/types"
import { nextFrame } from "@follow/utils/dom"
import type { FC } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { FeedForm } from "~/modules/discover/feed-form"
import { entries } from "~/queries/entries"

import { CustomSafeError } from "../../errors/CustomSafeError"
import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"
import { useModalStack } from "../ui/modal/stacked/hooks"
import { useResetErrorWhenRouteChange } from "./helper"
import { FeedPreview } from "./previews/FeedPreview"

const FeedFoundCanBeFollowErrorFallback: FC<AppErrorFallbackProps> = ({ resetError, error }) => {
  const { t } = useTranslation()
  if (!(error instanceof FeedFoundCanBeFollowError)) {
    throw error
  }
  const feed = error.detail
  const { present } = useModalStack()
  const navigate = useNavigate()
  useResetErrorWhenRouteChange(resetError)

  return (
    <div className="bg-theme-modal-background-opaque flex w-full flex-col overflow-auto p-2">
      <FeedPreview feedId={feed.id}>
        {{
          actions: (
            <div className="center mt-3 gap-4">
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

              <Button
                onClick={() => {
                  present({
                    title: t("feed_form.add_feed"),
                    content: ({ dismiss }) => (
                      <FeedForm
                        url={feed.url}
                        defaultValues={{
                          view: getRouteParams().view.toString(),
                        }}
                        onSuccess={() => {
                          dismiss()

                          const { feedId, view } = getRouteParams()

                          const entriesOptions = {
                            id: feedId,
                            view,
                          }

                          entries.entries(entriesOptions).remove()
                          nextFrame(() => resetError())
                        }}
                      />
                    ),
                  })
                }}
                variant="primary"
              >
                Follow
              </Button>
            </div>
          ),
        }}
      </FeedPreview>
    </div>
  )
}

export default FeedFoundCanBeFollowErrorFallback
export class FeedFoundCanBeFollowError extends CustomSafeError {
  constructor(public detail: FeedModel) {
    super("Feed Found Can Be Follow")
  }
}
