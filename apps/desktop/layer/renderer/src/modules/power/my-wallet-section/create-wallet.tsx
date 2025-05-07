import { Button } from "@follow/components/ui/button/index.js"
import { Trans, useTranslation } from "react-i18next"

import { useCreateWalletMutation } from "~/queries/wallet"

export const CreateWallet = () => {
  const mutation = useCreateWalletMutation()
  const { t } = useTranslation("settings")

  return (
    <div>
      <p className="text-base">
        <Trans
          i18nKey="wallet.create.description"
          ns="settings"
          components={{
            PowerIcon: <i className="i-mgc-power text-accent translate-y-[2px]" />,
            strong: <strong />,
          }}
        />
      </p>
      <div className="mt-4 text-right">
        <Button variant="primary" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
          {t("wallet.create.button")}
        </Button>
      </div>
    </div>
  )
}
