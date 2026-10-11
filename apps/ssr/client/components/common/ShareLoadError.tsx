import { Button } from "@follow/components/ui/button/index.jsx"
import * as React from "react"
import { useTranslation } from "react-i18next"

export const ShareLoadError = ({ title, onRetry }: { title: string; onRetry: () => void }) => {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <i className="i-mgc-warning-fill mb-6 size-12 text-orange-500" />
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <p className="mt-3 text-zinc-500 dark:text-zinc-400">{t("share.load_error_description")}</p>
      <Button buttonClassName="mt-8" onClick={onRetry}>
        {t("share.retry")}
      </Button>
    </div>
  )
}
