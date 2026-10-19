import type { ProductSubscription, SubscriptionOffer } from "expo-iap"
import { describe, expect, it } from "vitest"

import {
  getGooglePlayProductId,
  getGooglePlayProductIds,
  parseGooglePlayFreeTrial,
  selectGooglePlayOffer,
  toGooglePlaySubscriptionProduct,
} from "./google-play-purchase"

const phase = (
  billingPeriod: string,
  formattedPrice: string,
  priceAmountMicros: string,
  recurrenceMode = 1,
) => ({
  billingCycleCount: recurrenceMode === 1 ? 0 : 1,
  billingPeriod,
  formattedPrice,
  priceAmountMicros,
  priceCurrencyCode: "USD",
  recurrenceMode,
})

const basePlanOffer: SubscriptionOffer = {
  id: "monthly",
  basePlanIdAndroid: "monthly",
  displayPrice: "$9.99",
  offerTokenAndroid: "base-plan-token",
  price: 9.99,
  pricingPhasesAndroid: { pricingPhaseList: [phase("P1M", "$9.99", "9990000")] },
  type: "introductory",
}

const freeTrialOffer: SubscriptionOffer = {
  id: "free-trial",
  basePlanIdAndroid: "monthly",
  displayPrice: "Free",
  offerTokenAndroid: "free-trial-token",
  price: 0,
  pricingPhasesAndroid: {
    pricingPhaseList: [phase("P1W", "Free", "0", 2), phase("P1M", "$9.99", "9990000")],
  },
  type: "promotional",
}

const product = (subscriptionOffers: SubscriptionOffer[]): ProductSubscription => ({
  currency: "USD",
  description: "Folo Plus",
  displayPrice: "$9.99",
  id: "is.follow.plus.monthly",
  nameAndroid: "Folo Plus",
  platform: "android",
  subscriptionOffers,
  title: "Folo Plus (Folo)",
  type: "subs",
})

describe("Google Play offers", () => {
  it("prefers a free trial the user is still eligible for, then the base plan", () => {
    expect(selectGooglePlayOffer([basePlanOffer, freeTrialOffer])).toBe(freeTrialOffer)
    expect(selectGooglePlayOffer([basePlanOffer])).toBe(basePlanOffer)
    expect(selectGooglePlayOffer([{ ...basePlanOffer, offerTokenAndroid: null }])).toBeNull()
  })

  it("reads free trial lengths from ISO 8601 billing periods", () => {
    expect(parseGooglePlayFreeTrial("P7D", 1)).toEqual({ unit: "day", count: 7 })
    expect(parseGooglePlayFreeTrial("P1W", 2)).toEqual({ unit: "day", count: 14 })
    expect(parseGooglePlayFreeTrial("P1M", 1)).toEqual({ unit: "month", count: 1 })
    expect(parseGooglePlayFreeTrial("P1Y", 1)).toEqual({ unit: "month", count: 12 })
    expect(parseGooglePlayFreeTrial("P1M2D", 1)).toBeNull()
  })

  it("shows the price charged after the free trial and keeps the offer token to buy it", () => {
    expect(toGooglePlaySubscriptionProduct(product([basePlanOffer, freeTrialOffer]))).toEqual({
      id: "is.follow.plus.monthly",
      displayPrice: "$9.99",
      offerToken: "free-trial-token",
      freeTrial: { unit: "day", count: 7 },
    })
    expect(toGooglePlaySubscriptionProduct(product([basePlanOffer]))).toEqual({
      id: "is.follow.plus.monthly",
      displayPrice: "$9.99",
      offerToken: "base-plan-token",
      freeTrial: null,
    })
    expect(toGooglePlaySubscriptionProduct(product([]))).toBeNull()
  })
})

describe("Google Play plan products", () => {
  const plans = [
    { name: "Free" },
    {
      name: "Plus",
      googlePlayProductIdentifier: "is.follow.plus.monthly",
      googlePlayProductIdentifierAnnual: "is.follow.plus.yearly",
    },
  ]

  it("reads the product of each billing period from the server plans", () => {
    expect(getGooglePlayProductId(plans[1]!, false)).toBe("is.follow.plus.monthly")
    expect(getGooglePlayProductId(plans[1]!, true)).toBe("is.follow.plus.yearly")
    expect(getGooglePlayProductId(plans[0]!, true)).toBeNull()
    expect(getGooglePlayProductIds(plans)).toEqual([
      "is.follow.plus.monthly",
      "is.follow.plus.yearly",
    ])
  })
})
