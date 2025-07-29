import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { useFeedById } from "@follow/store/feed/hooks"
import { feedIconSelector } from "@follow/store/feed/selectors"
import { from } from "dnum"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useState } from "react"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { useBoostFeedMutation, useBoostStatusQuery } from "~/modules/boost/query"
import { useWallet } from "~/queries/wallet"

import { FeedIcon } from "../feed/feed-icon"
import { useTOTPModalWrapper } from "../profile/hooks"
import { BoostProgress } from "./boost-progress"
import { BoostingContributors } from "./boosting-contributors"
import { LevelBenefits } from "./level-benefits"
import { RadioCards } from "./radio-cards"

export const BoostModalContent = ({ feedId }: { feedId: string }) => {
  const t = useI18n()
  const myWallet = useWallet()
  const myWalletData = myWallet.data?.[0]

  const dPowerBigInt = BigInt(myWalletData?.dailyPowerToken ?? 0)
  const cPowerBigInt = BigInt(myWalletData?.cashablePowerToken ?? 0)
  const balanceBigInt = cPowerBigInt + dPowerBigInt
  const [amount, setAmount] = useState<number>(0)
  const amountBigInt = from(amount, 18)[0]
  const wrongNumberRange = amountBigInt > balanceBigInt || amountBigInt <= BigInt(0)

  const { data: boostStatus, isLoading } = useBoostStatusQuery(feedId)
  const boostFeedMutation = useBoostFeedMutation()
  const { dismiss } = useCurrentModal()
  const present = useTOTPModalWrapper(boostFeedMutation.mutateAsync)

  const handleBoost = useCallback(() => {
    if (boostFeedMutation.isPending) return
    present({ feedId, amount: amountBigInt.toString() })
  }, [amountBigInt, boostFeedMutation.isPending, feedId, present])

  const feed = useFeedById(feedId, feedIconSelector)

  if (isLoading || !boostStatus) {
    return (
      <div className="center pointer-events-none grow -translate-y-16">
        <LoadingWithIcon icon={<i className="i-mgc-rocket-cute-fi" />} size="large" />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:max-h-[700px] lg:w-[80vw] lg:max-w-[450px]">
      <div className="center flex flex-col gap-2">
        <FeedIcon noMargin feed={feed} size={50} />

        <h1 className="center mt-2 flex flex-wrap text-lg font-bold">
          <div className="center flex shrink-0">
            <i className="i-mgc-rocket-cute-fi mr-1.5 shrink-0 text-lg" />
            {t("boost.boost_feed")}
          </div>
          <span>「{feed?.title}」</span>
        </h1>
      </div>
      <div className="relative flex w-full grow flex-col items-center gap-3">
        <small className="center text-text-secondary -mt-1 mb-2 max-w-prose gap-1 text-balance text-center">
          {t("boost.boost_feed_description")}
        </small>

        <BoostProgress {...boostStatus} />

        <AnimatePresence>
          {!boostFeedMutation.isSuccess && (
            <RadioCards
              monthlyBoostCost={boostStatus.monthlyBoostCost}
              value={amount}
              onValueChange={setAmount}
            />
          )}
        </AnimatePresence>
      </div>

      {boostFeedMutation.isSuccess ? (
        <>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={Spring.presets.softSpring}
          >
            {t("boost.boost_success_thanks")}
          </m.p>
          <Button variant="primary" onClick={() => dismiss()}>
            {t.common("words.close")}
          </Button>
        </>
      ) : (
        <Button
          disabled={boostFeedMutation.isSuccess || boostFeedMutation.isPending || wrongNumberRange}
          isLoading={boostFeedMutation.isPending}
          variant="primary"
          onClick={handleBoost}
        >
          <i className="i-mgc-rocket-cute-fi mr-2 shrink-0" />
          {t("words.boost")}
        </Button>
      )}

      <BoostingContributors feedId={feedId} />
      <LevelBenefits />
    </div>
  )
}
