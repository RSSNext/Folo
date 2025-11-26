import { Button } from "@follow/components/ui/button/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useRecaptchaToken } from "~/hooks/common"
import { useClaimCheck, useClaimWalletDailyRewardMutation } from "~/queries/wallet"

export const ClaimDailyReward = () => {
  const mutation = useClaimWalletDailyRewardMutation()
  const { t } = useTranslation(["settings", "app"])

  const check = useClaimCheck()
  const canClaim = check.data?.data

  const serverConfigs = useServerConfigs()

  const requestRecaptchaToken = useRecaptchaToken()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <>
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={async () => {
              const recaptchaToken = await requestRecaptchaToken("desktop_wallet_daily_reward")

              mutation.mutate({ tokenV3: recaptchaToken })
            }}
            disabled={!canClaim}
          >
            {canClaim ? t("wallet.claim.button.claim") : t("wallet.claim.button.claimed")}
          </Button>
        </>
      </TooltipTrigger>
      <TooltipContent>
        {canClaim ? (
          <Trans
            i18nKey="wallet.claim.tooltip.canClaim"
            ns="settings"
            values={{ amount: serverConfigs?.DAILY_CLAIM_AMOUNT.normal }}
          />
        ) : (
          t("wallet.claim.tooltip.alreadyClaimed")
        )}
      </TooltipContent>
    </Tooltip>
  )
}
