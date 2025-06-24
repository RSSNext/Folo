import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { TransactionTypes } from "@follow/models"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { RelativeTime } from "~/components/ui/datetime"
import { getBlockchainExplorerUrl } from "~/lib/utils"
import { useWalletTransactions } from "~/queries/wallet"

import type { TxTableProps } from "./components"
import { BalanceRenderer, TypeRenderer, UserRenderer } from "./components"

export const TxTable = ({ className, type }: ComponentType<TxTableProps>) => {
  const { t } = useTranslation("settings")
  const user = useWhoami()
  const transactions = useWalletTransactions({
    fromOrToUserId: user?.id,
    type: type === "all" ? undefined : (type as (typeof TransactionTypes)[number]),
  })

  return (
    <div className={cn("w-fit min-w-0 grow overflow-x-auto", className)}>
      <Table className="w-full table-fixed">
        <TableHeader className="bg-theme-background sticky top-0">
          <TableRow className="[&_*]:!pl-0 [&_*]:!font-semibold">
            <TableHead>{t("wallet.transactions.type")}</TableHead>
            <TableHead>{t("wallet.transactions.amount")}</TableHead>
            <TableHead>{t("wallet.transactions.from")}</TableHead>
            <TableHead>{t("wallet.transactions.to")}</TableHead>
            <TableHead>{t("wallet.transactions.date")}</TableHead>
            <TableHead>{t("wallet.transactions.tx")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.data?.map((row) => (
            <TableRow key={row.hash}>
              <TableCell align="left" size="sm">
                <TypeRenderer type={row.type} />
              </TableCell>
              <TableCell align="left" size="sm">
                <BalanceRenderer
                  sign={row.fromUserId === user?.id ? "-" : "+"}
                  amount={row.powerToken}
                  tax={row.tax}
                />
              </TableCell>
              <TableCell align="left" size="sm">
                <UserRenderer user={row.fromUser} />
              </TableCell>
              <TableCell align="left" size="sm">
                <UserRenderer user={row.toUser} />
              </TableCell>

              <TableCell align="left" size="sm">
                <EllipsisHorizontalTextWithTooltip>
                  <RelativeTime date={row.createdAt} dateFormatTemplate="l" />
                </EllipsisHorizontalTextWithTooltip>
              </TableCell>
              <TableCell align="left" size="sm">
                <Tooltip>
                  <TooltipTrigger>
                    <a
                      target="_blank"
                      href={`${getBlockchainExplorerUrl()}/tx/${row.hash}`}
                      className="underline"
                    >
                      {row.hash.slice(0, 10)}...
                    </a>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent>{row.hash}</TooltipContent>
                  </TooltipPortal>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
