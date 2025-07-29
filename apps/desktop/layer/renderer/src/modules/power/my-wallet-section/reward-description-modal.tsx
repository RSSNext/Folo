import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { from } from "dnum"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { getLevelMultiplier } from "~/lib/utils"
import { Balance } from "~/modules/wallet/balance"
import { Level } from "~/modules/wallet/level"

export const useRewardDescriptionModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()

  return useCallback(() => {
    present({
      content: () => (
        <div className="relative size-full max-w-[700px] py-4">
          <div>
            <p className="mb-6 font-semibold">{t("wallet.rewardDescription.description1")}</p>
            <p>1. {t("wallet.rewardDescription.description2")}</p>
            <Table className="my-6">
              <TableHeader>
                <TableRow className="[&>th]:h-8">
                  <TableHead>{t("wallet.rewardDescription.level")}</TableHead>
                  <TableHead>{t("wallet.rewardDescription.percentage")}</TableHead>
                  <TableHead>{t("wallet.rewardDescription.reward")}</TableHead>
                  <TableHead>{t("wallet.rewardDescription.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serverConfigs?.DAILY_POWER_PERCENTAGES.map((percentage, index) => {
                  const level = serverConfigs?.DAILY_POWER_PERCENTAGES.length - index - 1
                  const rankPercentage = serverConfigs?.LEVEL_PERCENTAGES[index]
                  return (
                    <TableRow key={percentage} className="[&>td]:py-2">
                      <TableCell>
                        <Level level={level} />
                      </TableCell>
                      <TableCell>{rankPercentage ? `${rankPercentage * 100}%` : "-"}</TableCell>
                      <TableCell>{getLevelMultiplier(level)}</TableCell>
                      <TableCell>
                        <Balance withSuffix>
                          {
                            from(
                              serverConfigs.DAILY_POWER_SUPPLY *
                                serverConfigs?.DAILY_POWER_PERCENTAGES[level]!,
                              18,
                            )[0]
                          }
                        </Balance>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p>2. {t("wallet.rewardDescription.description3")}</p>
          </div>
        </div>
      ),
      title: t("wallet.rewardDescription.title"),

      clickOutsideToDismiss: true,
    })
  }, [serverConfigs, present, t])
}
