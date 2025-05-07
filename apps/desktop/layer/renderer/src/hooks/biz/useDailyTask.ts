import { useCallback, useEffect } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

import { useClaimCheck, useClaimWalletDailyRewardMutation } from "~/queries/wallet"

export const useDailyTask = () => {
  const { mutateAsync: claimDaily } = useClaimWalletDailyRewardMutation()
  const check = useClaimCheck()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleReCaptchaVerify = useCallback(async () => {
    if (check.data?.data && executeRecaptcha) {
      const token = await executeRecaptcha("useDailyTask")
      claimDaily({ tokenV3: token })
    }
  }, [claimDaily, check.data?.data, executeRecaptcha])

  useEffect(() => {
    handleReCaptchaVerify()
  }, [handleReCaptchaVerify, check.data?.data])
}
