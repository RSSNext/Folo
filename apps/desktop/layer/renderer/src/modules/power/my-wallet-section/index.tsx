import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { SettingSectionTitle } from "~/modules/settings/section"
import { Balance } from "~/modules/wallet/balance"
import { useWallet } from "~/queries/wallet"

import { CreateWallet } from "./create-wallet"
import { WithdrawButton } from "./withdraw"

export const MyWalletSection = ({ className }: { className?: string }) => {
  const { t } = useTranslation("settings")
  const wallet = useWallet()
  const myWallet = wallet.data?.[0]

  if (wallet.isPending) {
    return (
      <div className="center absolute inset-0 flex">
        <LoadingWithIcon
          icon={<i className="i-mgc-power text-folo" />}
          size="large"
          className="-translate-y-full"
        />
      </div>
    )
  }

  if (!myWallet) {
    return <CreateWallet />
  }
  return (
    <div className={cn(className)}>
      <SettingSectionTitle title={t("wallet.balance.title")} margin="compact" />
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <Balance className="text-xl font-bold text-folo">
              {BigInt(myWallet.powerToken || 0n)}
            </Balance>
          </div>
          <Tooltip>
            <TooltipTrigger className="mt-1 block">
              <div className="flex flex-row items-center gap-x-2 text-xs">
                <span className="flex items-center gap-1 text-left">
                  {t("wallet.balance.withdrawable")} <i className="i-mgc-question-cute-re" />
                </span>
                <Balance className="center text-[12px] font-medium">
                  {myWallet.cashablePowerToken}
                </Balance>
              </div>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent align="start" className="z-[999]">
                <p>{t("wallet.balance.withdrawableTooltip")}</p>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>
        <div className="flex gap-2">
          <WithdrawButton />
        </div>
      </div>
    </div>
  )
}
