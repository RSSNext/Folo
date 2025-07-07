import { Folo } from "@follow/components/icons/folo.jsx"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { APP_STORE_URLS } from "@follow/constants"
import { getMobilePlatform, isMobileDevice } from "@follow/utils"
import { useEffect } from "react"

export function DownloadPage() {
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
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center space-x-4">
          <Logo className="size-12" />
          <Folo className="text-text w-12" />
        </div>
        <p className="text-text-secondary text-base">Next-Gen Information Browser</p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-xs space-y-6 text-center">
        <div>
          <h1 className="text-text mb-3 text-xl font-semibold">Download Folo</h1>
          <p className="text-text-secondary text-sm">
            {isMobile
              ? mobilePlatform
                ? `Get the ${mobilePlatform} app for the best experience`
                : "Get the mobile app for the best experience"
              : "Get the mobile app for the best experience"}
          </p>
        </div>

        {/* Download Button */}
        <Button onClick={isMobile ? handleMobileDownload : openDownloadPage}>
          <i className="i-mgc-download-2-cute-re mr-2 text-lg" />
          <span>
            {isMobile && mobilePlatform ? `Download for ${mobilePlatform}` : "Go to Download Page"}
          </span>
        </Button>

        {/* Hint */}
        <p className="text-text-tertiary text-xs">
          {isMobile
            ? mobilePlatform
              ? `Redirecting to ${mobilePlatform === "iOS" ? "App Store" : "Google Play"}...`
              : "Available for iOS, Android, Windows, macOS & Linux"
            : "Available for iOS, Android, Windows, macOS & Linux"}
        </p>
      </div>
    </div>
  )
}

export default DownloadPage
