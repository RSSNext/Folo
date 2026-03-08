import { Button } from "@follow/components/ui/button/index.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ipcServices } from "~/lib/client"

import { SettingSectionTitle } from "../section"

export const SettingCli = () => {
  interface CliInstallStatus {
    installed: boolean
    installPath: string | null
    cliSourceAvailable: boolean
  }
  const { t } = useTranslation("settings")
  const [status, setStatus] = useState<CliInstallStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    const result = await ipcServices?.cli.getInstallStatus()
    if (result) {
      setStatus(result)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const handleInstall = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ipcServices?.cli.installCli()
      if (result?.success) {
        toast.success(t("cli.install_success"))
      } else {
        toast.error(result?.error || t("cli.install_failed"))
      }
    } catch {
      toast.error(t("cli.install_failed"))
    }
    await refreshStatus()
    setLoading(false)
  }, [t, refreshStatus])

  const handleUninstall = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ipcServices?.cli.uninstallCli()
      if (result?.success) {
        toast.success(t("cli.uninstall_success"))
      } else {
        toast.error(result?.error || t("cli.uninstall_failed"))
      }
    } catch {
      toast.error(t("cli.uninstall_failed"))
    }
    await refreshStatus()
    setLoading(false)
  }, [t, refreshStatus])

  if (!IN_ELECTRON) return null

  return (
    <div className="mt-4 space-y-6">
      <SettingSectionTitle title={t("cli.title")} />

      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{t("cli.description")}</p>

        {status && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {status.installed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-xs text-green">
                  <i className="i-mingcute-check-line" />
                  {t("cli.installed")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-500">
                  {t("cli.not_installed")}
                </span>
              )}
            </div>

            {status.installed && status.installPath && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("cli.path")}:</span>
                <code className="rounded bg-fill-quaternary px-2 py-0.5 text-xs">
                  {status.installPath}
                </code>
              </div>
            )}

            {!status.cliSourceAvailable && (
              <p className="text-sm text-orange-500">{t("cli.not_available")}</p>
            )}

            <div className="flex gap-2">
              {!status.installed ? (
                <Button
                  onClick={handleInstall}
                  disabled={loading || !status.cliSourceAvailable}
                  isLoading={loading}
                >
                  {t("cli.install")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleUninstall}
                  disabled={loading}
                  isLoading={loading}
                >
                  {t("cli.uninstall")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
