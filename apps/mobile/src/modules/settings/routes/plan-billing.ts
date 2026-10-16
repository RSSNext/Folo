import type { MobileBillingProvider } from "@/src/lib/payment"

export type SubscriptionSource = "stripe" | "apple" | "google"

/**
 * A subscription bought in an app store can only change in that store, and Google Play installs
 * sell nothing but Google Play subscriptions.
 */
export const canChangeSubscriptionHere = (
  source: SubscriptionSource | null | undefined,
  billingProvider: MobileBillingProvider,
) => {
  if (!source) {
    return true
  }

  switch (billingProvider) {
    case "google-play": {
      return source === "google"
    }
    case "app-store": {
      return source !== "google"
    }
    case "stripe": {
      return source === "stripe"
    }
  }
}

export type SubscriptionManagement = "apple-hint" | "other-platform-hint" | "manage-button"

export const getSubscriptionManagement = (
  source: SubscriptionSource | null | undefined,
  billingProvider: MobileBillingProvider,
): SubscriptionManagement => {
  if (source === "apple") {
    return billingProvider === "google-play" ? "other-platform-hint" : "apple-hint"
  }

  return canChangeSubscriptionHere(source, billingProvider)
    ? "manage-button"
    : "other-platform-hint"
}
