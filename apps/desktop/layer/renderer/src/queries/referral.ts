import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

export const referral = {
  get: () =>
    defineQuery(
      ["referral"],
      async () => {
        const res = await apiClient.referrals.$get()
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
