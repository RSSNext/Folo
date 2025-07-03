import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { useTranslation } from "react-i18next"

import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { MyWalletSection } from "~/modules/power/my-wallet-section"
import { TransactionsSection } from "~/modules/power/transaction-section"

export function Component() {
  const { t } = useTranslation()
  useSubViewTitle(
    <div className="flex items-center gap-2">
      <i className="i-mgc-power text-accent size-4" />
      {t("words.power")}
    </div>,
    t("words.power"),
  )
  return (
    <div className="px-5 md:px-10 lg:w-[768px] lg:px-0">
      <div className="center mb-8 flex h-24 items-center gap-2 text-3xl font-bold">
        <div className="motion-preset-shake center text-accent motion-delay-500">
          <i className="i-mgc-power size-20" />
        </div>
      </div>
      <MyWalletSection />

      <Divider className="my-8" />
      <AutoResizeHeight>
        <TransactionsSection />
      </AutoResizeHeight>
    </div>
  )
}
