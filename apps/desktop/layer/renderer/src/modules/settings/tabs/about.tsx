import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { SocialMediaLinks } from "@follow/constants"
import { IN_ELECTRON, MODE, ModeEnum } from "@follow/shared/constants"
import { getCurrentEnvironment } from "@follow/utils/environment"
import { cn } from "@follow/utils/utils"
import PKG, { repository } from "@pkg"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ipcServices } from "~/lib/client"
import { getNewIssueUrl } from "~/lib/issues"

export const SettingAbout = () => {
  const { t } = useTranslation("settings")
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const currentEnvironment = getCurrentEnvironment().join("\n")
  const { data: appVersion } = useQuery({
    queryKey: ["appVersion"],
    queryFn: () => ipcServices?.app.getAppVersion(),
  })

  const rendererVersion = PKG.version

  const handleCheckForUpdates = async () => {
    if (isCheckingUpdate) return

    setIsCheckingUpdate(true)
    const toastId = toast.loading(t("about.checkingForUpdates"))

    try {
      const result = await ipcServices?.app.checkForUpdates()

      if (result?.error) {
        toast.error(t("about.updateCheckFailed"), { id: toastId })
      } else if (result?.hasUpdate) {
        toast.success(t("about.updateAvailable"), { id: toastId })
      } else {
        toast.info(t("about.noUpdateAvailable"), { id: toastId })
      }
    } catch {
      toast.error(t("about.updateCheckFailed"), { id: toastId })
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleOpenLegal = (type: "privacy" | "tos") => {
    const path = type === "privacy" ? "privacy-policy" : "terms-of-service"
    window.open(`https://folo.is/${path}`, "_blank")
  }

  return (
    <div className="mx-auto mt-6 max-w-3xl space-y-8">
      {/* Header Section */}
      <div className="px-2 text-center">
        <div className="mb-6 flex justify-center">
          <Logo className="size-20" />
        </div>
        <h1 className="-mt-6 flex justify-center">
          <Folo className="size-16" />
        </h1>
        {MODE !== ModeEnum.production && (
          <span className="block -translate-y-2 text-sm font-normal text-text-tertiary">
            {MODE}
          </span>
        )}
        <p className="mt-2 text-sm text-text-secondary">
          {t("about.licenseInfo", { appName: APP_NAME, currentYear: new Date().getFullYear() })}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {appVersion && (
            <span className="inline-flex items-center rounded-full bg-fill-secondary px-3 py-1 text-xs font-medium text-text-secondary">
              <span className="mr-1.5 text-text-tertiary">App</span>
              {appVersion}
            </span>
          )}
          {rendererVersion && (
            <span className="inline-flex items-center rounded-full bg-fill-secondary px-3 py-1 text-xs font-medium text-text-secondary">
              <span className="mr-1.5 text-text-tertiary">Renderer</span>
              {rendererVersion}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                rendererVersion
                  ? `${currentEnvironment}\n**Renderer**: ${rendererVersion}`
                  : currentEnvironment,
              )
              toast.success(t("about.environmentCopied"))
            }}
            className="inline-flex items-center rounded-full px-3 py-1 text-xs text-text-tertiary transition-colors hover:bg-fill-secondary hover:text-text-secondary"
          >
            <i className="i-mgc-copy-cute-re mr-1.5" />
            {t("about.copyEnvironment")}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="-mx-3 space-y-1 px-2">
        {IN_ELECTRON && (
          <button
            type="button"
            onClick={handleCheckForUpdates}
            disabled={isCheckingUpdate}
            className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:bg-fill-secondary hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-medium">{t("about.checkForUpdates")}</div>
                <div className="text-xs text-text-tertiary">{t("about.updateDescription")}</div>
              </div>
            </div>
            {isCheckingUpdate ? (
              <i className="i-mgc-loading-3-cute-re animate-spin text-base" />
            ) : (
              <i className="i-mgc-arrow-right-up-cute-re text-base text-text-tertiary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.open(`${repository.url}/releases`, "_blank")}
          className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:bg-fill-secondary hover:shadow-sm"
        >
          <div>
            <div className="text-sm font-medium">{t("about.changelog")}</div>
            <div className="text-xs text-text-tertiary">{t("about.changelogDescription")}</div>
          </div>
          <i className="i-mgc-external-link-cute-re text-base text-text-tertiary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </button>
      </div>

      {/* Legal Section */}
      <div className="-mx-3 !mt-4 space-y-1 px-2">
        <Divider />
        <button
          type="button"
          onClick={() => handleOpenLegal("tos")}
          className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:bg-fill-secondary hover:shadow-sm"
        >
          <span className="text-sm">{t("about.termsOfService")}</span>
          <i className="i-mgc-external-link-cute-re text-text-tertiary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </button>
        <button
          type="button"
          onClick={() => handleOpenLegal("privacy")}
          className="group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:bg-fill-secondary hover:shadow-sm"
        >
          <span className="text-sm">{t("about.privacyPolicy")}</span>
          <i className="i-mgc-external-link-cute-re text-text-tertiary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </button>
      </div>

      {/* Resources Section */}
      <div className="px-2">
        <h2 className="mb-4 text-sm font-semibold text-text-secondary">{t("about.resources")}</h2>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            <Trans
              ns="settings"
              i18nKey="about.feedbackInfo"
              values={{ appName: APP_NAME, commitSha: GIT_COMMIT_SHA.slice(0, 7).toUpperCase() }}
              components={{
                OpenIssueLink: (
                  <a
                    className="text-accent hover:underline"
                    href={getNewIssueUrl({ template: "feature_request.yml" })}
                    target="_blank"
                  >
                    open an issue
                  </a>
                ),
              }}
            />
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t("about.projectLicense", { appName: APP_NAME })}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            <Trans
              ns="settings"
              i18nKey="about.iconLibrary"
              components={{
                IconLibraryLink: (
                  <a
                    className="text-accent hover:underline"
                    href="https://mgc.mingcute.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    MingCute Icons
                  </a>
                ),
              }}
            />
          </p>
        </div>
      </div>

      {/* Social Links */}
      <div className="px-2">
        <h2 className="mb-4 text-sm font-semibold text-text-secondary">{t("about.socialMedia")}</h2>
        <div className="flex flex-wrap gap-6">
          {SocialMediaLinks.map((link) => (
            <a
              href={link.url}
              key={link.url}
              className="flex items-center gap-2 text-sm transition-colors hover:text-accent"
              target="_blank"
              rel="noreferrer"
            >
              <i className={cn(link.iconClassName, "text-base")} />
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
