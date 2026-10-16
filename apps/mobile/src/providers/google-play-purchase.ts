import type { PricingPhaseAndroid, ProductSubscription, SubscriptionOffer } from "expo-iap"

type PlanWithGooglePlayProducts = {
  googlePlayProductIdentifier?: string | null
  googlePlayProductIdentifierAnnual?: string | null
}

export type GooglePlayFreeTrial = {
  unit: "day" | "month"
  count: number
}

export type GooglePlaySubscriptionProduct = {
  id: string
  // The recurring price of the base plan, after any free trial
  displayPrice: string
  offerToken: string
  freeTrial: GooglePlayFreeTrial | null
}

// Plans list the Google Play products since server configs added them; older SDK types lack the fields.
export const getGooglePlayProductId = (plan: object, annual: boolean) => {
  const products = plan as PlanWithGooglePlayProducts
  return (
    (annual ? products.googlePlayProductIdentifierAnnual : products.googlePlayProductIdentifier) ||
    null
  )
}

export const getGooglePlayProductIds = (plans: readonly object[] = []) =>
  plans.flatMap((plan) =>
    [getGooglePlayProductId(plan, false), getGooglePlayProductId(plan, true)].filter(
      (productId): productId is string => Boolean(productId),
    ),
  )

const isFreePhase = (phase: PricingPhaseAndroid) => phase.priceAmountMicros === "0"

const getPricingPhases = (offer: SubscriptionOffer) =>
  offer.pricingPhasesAndroid?.pricingPhaseList ?? []

/**
 * Google Play only returns the offers the user is eligible for, so a free trial offer means the
 * user can start one. Otherwise the base plan offer is used, which has no offer ID of its own.
 */
export const selectGooglePlayOffer = (offers: readonly SubscriptionOffer[]) => {
  const purchasableOffers = offers.filter((offer) => offer.offerTokenAndroid)

  return (
    purchasableOffers.find((offer) => getPricingPhases(offer).some(isFreePhase)) ??
    purchasableOffers.find((offer) => offer.id === offer.basePlanIdAndroid) ??
    purchasableOffers[0] ??
    null
  )
}

// Billing periods are ISO 8601 durations such as P7D, P1W, P1M or P1Y
export const parseGooglePlayFreeTrial = (
  billingPeriod: string,
  billingCycleCount: number,
): GooglePlayFreeTrial | null => {
  const match = /^P(\d+)([DWMY])$/.exec(billingPeriod)
  if (!match) {
    return null
  }

  const count = Number(match[1]) * Math.max(billingCycleCount, 1)
  switch (match[2]) {
    case "D": {
      return { unit: "day", count }
    }
    case "W": {
      return { unit: "day", count: count * 7 }
    }
    case "M": {
      return { unit: "month", count }
    }
    default: {
      return { unit: "month", count: count * 12 }
    }
  }
}

export const toGooglePlaySubscriptionProduct = (
  product: ProductSubscription,
): GooglePlaySubscriptionProduct | null => {
  if (product.platform !== "android") {
    return null
  }

  const offer = selectGooglePlayOffer(product.subscriptionOffers)
  if (!offer?.offerTokenAndroid) {
    return null
  }

  const phases = getPricingPhases(offer)
  const freePhase = phases.find(isFreePhase)

  return {
    id: product.id,
    displayPrice: phases.at(-1)?.formattedPrice || product.displayPrice,
    offerToken: offer.offerTokenAndroid,
    freeTrial: freePhase
      ? parseGooglePlayFreeTrial(freePhase.billingPeriod, freePhase.billingCycleCount)
      : null,
  }
}
