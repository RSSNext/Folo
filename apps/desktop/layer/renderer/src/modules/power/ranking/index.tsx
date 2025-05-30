import { useMobile } from "@follow/components/hooks/useMobile.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { cn } from "@follow/utils/utils"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { SettingSectionTitle } from "~/modules/settings/section"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { Balance } from "~/modules/wallet/balance"
import { Level } from "~/modules/wallet/level"
import type { useWalletTransactions } from "~/queries/wallet"
import { useWalletRanking } from "~/queries/wallet"

const medals = ["", "🥇", "🥈", "🥉"]
const rankNumber = (index: number) => {
  if (index < medals.length) {
    return <span className="ml-[-3px]">{medals[index]}</span>
  }
  return <span>{index}</span>
}

export const PowerRanking: Component = ({ className }) => {
  const { t } = useTranslation("settings")
  const ranking = useWalletRanking()

  const isMobile = useMobile()
  return (
    <div className="relative flex min-w-0 grow flex-col">
      <SettingSectionTitle title={t("wallet.ranking.title")} />
      <div className={cn("w-fit min-w-0 grow overflow-x-auto", className)}>
        <Table className="w-full table-fixed text-sm">
          <TableHeader className="bg-theme-background sticky top-0">
            <TableRow className="[&_*]:!font-semibold">
              <TableHead className="w-12">#</TableHead>
              <TableHead>{t("wallet.ranking.name")}</TableHead>
              <TableHead>{t("wallet.ranking.power")}</TableHead>
              <TableHead className="w-24">{t("wallet.ranking.level")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.data?.map((row, index) => {
              const lastRow = ranking.data?.[index - 1]
              const hasGap = lastRow?.rank && row.rank && row.rank - lastRow.rank !== 1

              return (
                <Fragment key={row.userId}>
                  {!!hasGap && (
                    <>
                      <TableRow>
                        <TableCell>...</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="p-0">
                          <div className="h-px w-full" />
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  <TableRow>
                    <TableCell>{!!row.rank && rankNumber(row.rank)}</TableCell>
                    <TableCell>
                      <UserRenderer
                        user={row.user}
                        avatarClassName={!!row.rank && row.rank <= 3 ? "size-6" : "size-5"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Balance
                          withSuffix
                          className="whitespace-nowrap"
                          withTooltip
                          scientificThreshold={isMobile ? 6 : 8}
                        >
                          {row.powerToken}
                        </Balance>
                      </div>
                    </TableCell>
                    <TableCell>{!!row.level && <Level level={row.level} />}</TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
            <TableRow>
              <TableCell>...</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const UserRenderer = ({
  user,
  avatarClassName,
}: {
  user?: NonNullable<ReturnType<typeof useWalletTransactions>["data"]>[number][
    | "fromUser"
    | "toUser"]
  avatarClassName?: string
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
      className="cursor-button flex w-full min-w-0 items-center gap-2"
    >
      <UserAvatar
        className="h-auto p-0"
        avatarClassName={cn(avatarClassName)}
        userId={user?.id}
        hideName
      />

      <div className="ml-1 w-0 grow truncate">
        <EllipsisHorizontalTextWithTooltip className="text-left">
          {isMe ? (
            <span className="font-bold">{t("wallet.transactions.you")}</span>
          ) : (
            <span>{name}</span>
          )}
        </EllipsisHorizontalTextWithTooltip>
      </div>
    </MotionButtonBase>
  )
}
