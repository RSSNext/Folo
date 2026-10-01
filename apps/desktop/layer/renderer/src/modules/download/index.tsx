import { Folo } from "@follow/components/icons/folo.jsx"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { APP_STORE_URLS } from "@follow/constants"
import { getMobilePlatform, isMobileDevice } from "@follow/utils"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export function DownloadPage() {
  const { t } = useTranslation()
  const openDownloadPage = () => {
    window.open("https://folo.is/download", "_blank", "noopener,noreferrer")
  }

  const mobilePlatform = getMobilePlatform()
  const isMobile = isMobileDevice()

  useEffect(() => {
    if (isMobile && mobilePlatform && APP_STORE_URLS[mobilePlatform]) {
      window.location.href = APP_STORE_URLS[mobilePlatform]
    }
  }, [isMobile, mobilePlatform])

  const handleMobileDownload = () => {
    if (mobilePlatform && APP_STORE_URLS[mobilePlatform]) {
      window.location.href = APP_STORE_URLS[mobilePlatform]
    } else {
      openDownloadPage()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center space-x-4">
          <Logo className="size-12" />
          <Folo className="w-12 text-text" />
        </div>
        <p className="text-base text-text-secondary">{t("download.tagline")}</p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-xs space-y-6 text-center">
        <div>
          <h1 className="mb-3 text-xl font-semibold text-text">
            {t("download.title", { appName: APP_NAME })}
          </h1>
          <p className="text-sm text-text-secondary">
            {isMobile && mobilePlatform
              ? t("download.get_platform_app", { platform: mobilePlatform })
              : t("download.get_mobile_app")}
          </p>
        </div>

        {/* Download Button */}
        <Button onClick={isMobile ? handleMobileDownload : openDownloadPage}>
          <i className="i-mgc-download-2-cute-re mr-2 text-lg" />
          <span>
            {isMobile && mobilePlatform
              ? t("download.download_for_platform", { platform: mobilePlatform })
              : t("download.go_to_download_page")}
          </span>
        </Button>

        {/* Hint */}
        <p className="text-xs text-text-tertiary">
          {isMobile && mobilePlatform
            ? t("download.redirecting_to_store", {
                store: mobilePlatform === "iOS" ? "App Store" : "Google Play",
              })
            : t("download.available_platforms")}
        </p>
      </div>
    </div>
  )
}

export default DownloadPage
