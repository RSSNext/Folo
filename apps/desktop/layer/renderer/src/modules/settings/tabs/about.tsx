import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { styledButtonVariant } from "@follow/components/ui/button/variants.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { SocialMediaLinks } from "@follow/constants"
import { IN_ELECTRON, MODE, ModeEnum } from "@follow/shared/constants"
import { getCurrentEnvironment } from "@follow/utils/environment"
import PKG, { repository } from "@pkg"
import { useQuery } from "@tanstack/react-query"
import { Trans, useTranslation } from "react-i18next"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { ipcServices } from "~/lib/client"
import { getNewIssueUrl } from "~/lib/issues"

export const SettingAbout = () => {
  const { t } = useTranslation("settings")
  const currentEnvironment = getCurrentEnvironment().join("\n")
  const { data: appVersion } = useQuery({
    queryKey: ["appVersion"],
    queryFn: () => ipcServices?.app.getAppVersion(),
  })

  const rendererVersion = PKG.version

  const handleCheckForUpdates = () => {
    ipcServices?.app.checkForUpdates()
  }

  return (
    <div>
      <section className="mt-4">
        <div className="flex gap-3">
          <Logo className="size-[52px]" />

          <div className="flex grow flex-col">
            <div className="text-lg font-bold">
              {APP_NAME} {MODE !== ModeEnum.production ? `(${MODE})` : ""}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {appVersion && (
                <span className="bg-material-medium rounded px-2 py-1 text-xs">
                  app: {appVersion}
                </span>
              )}
              {rendererVersion && (
                <span className="bg-material-medium rounded px-2 py-1 text-xs">
                  renderer: {rendererVersion}
                </span>
              )}
              <CopyButton
                variant="outline"
                value={
                  rendererVersion
                    ? `${currentEnvironment}\n**Renderer**: ${rendererVersion}`
                    : currentEnvironment
                }
                className="text-text-secondary hover:bg-theme-item-hover hover:text-text active:bg-theme-item-active border-0 bg-transparent p-1 [&_i]:size-3"
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {IN_ELECTRON && (
              <Button variant="outline" onClick={handleCheckForUpdates} buttonClassName="h-10">
                {t("about.checkForUpdates")}
              </Button>
            )}
            <Button
              variant="outline"
              buttonClassName="h-10"
              onClick={() => {
                window.open(`${repository.url}/releases`, "_blank")
              }}
            >
              {t("about.changelog")}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-balance text-sm">
          {t("about.licenseInfo", { appName: APP_NAME, currentYear: new Date().getFullYear() })}
        </p>
        <p className="mt-3 text-balance text-sm">
          <Trans
            ns="settings"
            i18nKey="about.iconLibrary"
            components={{
              IconLibraryLink: (
                <a
                  className="follow-link--underline inline-flex items-center"
                  href="https://mgc.mingcute.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://mgc.mingcute.com/
                </a>
              ),
              ExternalLinkIcon: <i className="i-mgc-external-link-cute-re translate-y-px" />,
            }}
          />
        </p>

        <p className="mt-3 text-sm">
          <Trans
            ns="settings"
            i18nKey="about.feedbackInfo"
            values={{ appName: APP_NAME, commitSha: GIT_COMMIT_SHA.slice(0, 7).toUpperCase() }}
            components={{
              OpenIssueLink: (
                <a
                  className="inline-flex cursor-pointer items-center gap-1 hover:underline"
                  href={getNewIssueUrl({ template: "feature_request.yml" })}
                  target="_blank"
                >
                  open an issue
                  <i className="i-mgc-external-link-cute-re" />
                </a>
              ),
              ExternalLinkIcon: <i className="i-mgc-external-link-cute-re" />,
            }}
          />
        </p>

        <Divider className="scale-x-50" />

        <h2 className="text-base font-semibold">{t("about.socialMedia")}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {SocialMediaLinks.map((link) => (
            <a
              href={link.url}
              key={link.url}
              className={styledButtonVariant({
                variant: "outline",
                className: "flex-1 gap-1",
              })}
              target="_blank"
              rel="noreferrer"
            >
              <i className={link.iconClassName} />
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
