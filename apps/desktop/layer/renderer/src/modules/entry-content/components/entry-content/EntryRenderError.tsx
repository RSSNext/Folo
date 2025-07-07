import { Button } from "@follow/components/ui/button/index.js"
import type { FallbackRender } from "@sentry/react"
import { useTranslation } from "react-i18next"

import { getNewIssueUrl } from "~/lib/issues"

export const EntryRenderError: FallbackRender = ({ error }) => {
  const { t } = useTranslation()
  const nextError = typeof error === "string" ? new Error(error) : (error as Error)
  return (
    <div className="center mt-16 flex flex-col gap-2">
      <i className="i-mgc-close-cute-re text-red text-3xl" />
      <span className="font-sans text-sm">
        {t("entry_content.render_error")} {nextError.message}
      </span>
      <Button
        variant={"outline"}
        onClick={() => {
          window.open(
            getNewIssueUrl({
              template: "bug_report.yml",
            }),
          )
        }}
      >
        {t("entry_content.report_issue")}
      </Button>
    </div>
  )
}
