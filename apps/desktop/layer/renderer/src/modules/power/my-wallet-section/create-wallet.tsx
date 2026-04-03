import { Button } from "@follow/components/ui/button/index.js"
import { Trans, useTranslation } from "react-i18next"

import { useCreateWalletMutation } from "~/queries/wallet"

export const CreateWallet = () => {
  const mutation = useCreateWalletMutation()
  const { t } = useTranslation("settings")

  return (
    <div className="rounded-2xl border border-fill-secondary bg-material-ultra-thin p-6 shadow-sm">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-fill-quaternary text-folo">
            <i className="i-mgc-power text-2xl" />
          </div>
          <p className="max-w-2xl text-base text-text-secondary">
            <Trans
              i18nKey="wallet.create.description"
              ns="settings"
              components={{
                PowerIcon: <i className="i-mgc-power translate-y-[2px] text-folo" />,
                strong: <strong className="text-text" />,
              }}
            />
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t("wallet.create.button")}
          </Button>
        </div>
      </div>
    </div>
  )
}
