import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

export const referral = {
  get: () =>
    defineQuery(
      ["referral"],
      async () => {
        const res = await followClient.api.referrals.getReferrals()
        return res.data
      },
      {
        rootKey: ["referral"],
      },
    ),
}

export function useReferralInfo() {
  return useAuthQuery(referral.get())
}
