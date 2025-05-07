import { Logo } from "@follow/components/icons/logo.jsx"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { Balance } from "~/modules/wallet/balance"
import type { useWalletTransactions } from "~/queries/wallet"

export interface TxTableProps {
  type: string
}
export const TypeRenderer = ({
  type,
}: {
  type: NonNullable<ReturnType<typeof useWalletTransactions>["data"]>[number]["type"]
}) => {
  const { t } = useTranslation("settings")
  return <div className="uppercase">{t(`wallet.transactions.types.${type}`)}</div>
}

export const BalanceRenderer = ({
  sign,
  amount,
  tax,
}: {
  sign: "+" | "-"
  amount: NonNullable<ReturnType<typeof useWalletTransactions>["data"]>[number]["powerToken"]
  tax: NonNullable<ReturnType<typeof useWalletTransactions>["data"]>[number]["tax"]
}) => {
  const hideTax = sign === "-" || tax === "0"
  return (
    <EllipsisHorizontalTextWithTooltip
      className={cn("flex items-center tabular-nums", {
        "text-green-500": sign === "+",
        "text-red-500": sign === "-",
      })}
    >
      {sign}
      <Balance>{amount}</Balance>
      {!hideTax && (
        <span className="text-xs text-gray-500">
          (-<Balance>{tax}</Balance>)
        </span>
      )}
    </EllipsisHorizontalTextWithTooltip>
  )
}

export const UserRenderer = ({
  user,
  hideName,
  iconClassName,
}: {
  user?: NonNullable<ReturnType<typeof useWalletTransactions>["data"]>[number][
    | "fromUser"
    | "toUser"]
  hideName?: boolean
  iconClassName?: string
}) => {
  const { t } = useTranslation("settings")
  const me = useWhoami()
  const isMe = user?.id === me?.id

  const name = isMe ? t("wallet.transactions.you") : user?.name || APP_NAME

  const presentUserModal = usePresentUserProfileModal("drawer")
  return (
    <MotionButtonBase
      onClick={() => {
        if (user?.id) presentUserModal(user.id)
      }}
      className="cursor-button flex w-full min-w-0 items-center"
    >
      {name === APP_NAME ? (
        <Logo className={cn("aspect-square size-4", iconClassName)} />
      ) : (
        <UserAvatar
          userId={user?.id}
          hideName
          className="h-auto p-0"
          avatarClassName={cn("size-4", iconClassName)}
        />
      )}

      {!hideName && (
        <div className="ml-1 w-0 grow truncate">
          <EllipsisHorizontalTextWithTooltip className="text-left">
            {isMe ? (
              <span className="font-bold">{t("wallet.transactions.you")}</span>
            ) : (
              <span>{name}</span>
            )}
          </EllipsisHorizontalTextWithTooltip>
        </div>
      )}
    </MotionButtonBase>
  )
}
