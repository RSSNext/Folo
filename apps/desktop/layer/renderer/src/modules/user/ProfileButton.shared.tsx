import type { WalletModel } from "@follow/models"
import { cn } from "@follow/utils/utils"

import { Balance } from "../wallet/balance"

export const PowerButton: Component<{
  isLoading: boolean
  myWallet?: WalletModel
  className?: string
}> = ({ isLoading, myWallet, className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <i className="i-mgc-power text-accent" />
      {isLoading ? (
        <span className="bg-theme-inactive h-3 w-8 animate-pulse rounded-xl" />
      ) : (
        <Balance precision={0}>{BigInt(myWallet?.powerToken || 0n)}</Balance>
      )}
    </div>
  )
}
