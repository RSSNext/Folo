import { Button } from "@follow/components/ui/button/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { env } from "@follow/shared/env.desktop"
import { useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useClaimCheck, useClaimWalletDailyRewardMutation } from "~/queries/wallet"

export const ClaimDailyReward = () => {
  const mutation = useClaimWalletDailyRewardMutation()
  const { t } = useTranslation("settings")

  const check = useClaimCheck()
  const canClaim = check.data?.data

  const serverConfigs = useServerConfigs()

  const recaptchaRef = useRef<ReCAPTCHA>(null)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <>
          <ReCAPTCHA ref={recaptchaRef} sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY} size="invisible" />
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={async () => {
              const token = await recaptchaRef.current?.executeAsync()
              mutation.mutate({ tokenV2: token })
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
