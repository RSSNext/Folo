import { useMobile } from "@follow/components/hooks/useMobile.js"
import { WEB_BUILD } from "@follow/shared/constants"
import { repository } from "@pkg"
import { useTranslation } from "react-i18next"

export const FooterInfo = () => {
  const { t } = useTranslation()

  const isMobile = useMobile()
  return (
    <div className="relative">
      {APP_VERSION?.[0] === "0" && (
        <div className="pointer-events-none w-full py-3 text-center text-xs opacity-20">
          {t("beta_access")} {GIT_COMMIT_SHA ? `(${GIT_COMMIT_SHA.slice(0, 7).toUpperCase()})` : ""}
        </div>
      )}

      {WEB_BUILD && !isMobile && (
        <div className="center absolute inset-y-0 right-2">
          <button
            type="button"
            aria-label="Download Desktop App"
            onClick={() => {
              window.open(`${repository.url}/releases`)
            }}
            className="center bg-background rounded-full border p-1.5 shadow-sm"
          >
            <i className="i-mgc-download-2-cute-re size-3.5 opacity-80" />
          </button>
        </div>
      )}
    </div>
  )
}
