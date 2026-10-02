import { whoamiQueryKey } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { requireNativeModule } from "expo"
import type { ProductSubscription, Purchase } from "expo-iap"
import { ErrorCode, getTransactionJwsIOS, useIAP } from "expo-iap"
import type { PropsWithChildren } from "react"
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { followClient } from "@/src/lib/api-client"
import { proxyEnv } from "@/src/lib/proxy-env"
import { queryClient } from "@/src/lib/query-client"
import { toast } from "@/src/lib/toast"

import {
  buildAppleVerificationRequest,
  isKnownAppleSubscriptionPurchase,
  selectSignedTransactionInfo,
} from "./apple-iap-purchase"

const billingSubscriptionQueryKey = ["billingSubscription"]
const nativeStoreKitE2E = process.env.EXPO_PUBLIC_E2E_IAP_NATIVE === "1"

const logStoreKitE2E = (event: string) => {
  if (nativeStoreKitE2E) console.info(`[StoreKit E2E] ${event}`)
}

type BillingSubscriptionResponse = {
  source: "stripe" | "apple" | null
  plan: string | null
  status: string | null
  productId: string | null
  periodEnd: string | null
  trialEnd: string | null
  canManage: boolean
}

type IAPPurchaseError = {
  code?: ErrorCode | string
  message?: string
}

type AppleIAPContextValue = {
  connected: boolean
  subscriptions: ProductSubscription[]
  isPurchasing: boolean
  isProcessingPurchase: boolean
  isRestoring: boolean
  loadSubscriptions: (skus: string[]) => Promise<void>
  requestSubscriptionPurchase: (input: {
    sku: string
    appAccountToken?: string | null
  }) => Promise<void>
  restoreSubscriptionPurchases: () => Promise<void>
}

const AppleIAPContext = createContext<AppleIAPContextValue | null>(null)

const refreshBillingState = async () => {
  await Promise.allSettled([
    userSyncService.whoami(),
    queryClient.invalidateQueries({ queryKey: whoamiQueryKey }),
    queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey }),
  ])
}

export const AppleIAPProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const knownSubscriptionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const plan of serverConfigs?.PAYMENT_PLAN_LIST ?? []) {
      if (plan.appleProductIdentifier) {
        ids.add(plan.appleProductIdentifier)
      }
      if (plan.appleProductIdentifierAnnual) {
        ids.add(plan.appleProductIdentifierAnnual)
      }
    }
    return ids
  }, [serverConfigs?.PAYMENT_PLAN_LIST])

  const availablePurchasesRef = useRef<Purchase[]>([])
  const processedTransactionsRef = useRef(new Set<string>())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null)
  const [currentPurchaseError, setCurrentPurchaseError] = useState<IAPPurchaseError | null>(null)

  const storeKitTestHelper = useMemo(() => {
    if (Platform.OS !== "ios" || !proxyEnv.API_URL.startsWith("http://localhost")) {
      return null
    }

    try {
      return requireNativeModule("StoreKitTestHelper") as {
        prepareLocalSubscriptions?: () => Promise<{ enabled: boolean }>
        clearPurchaseError?: () => Promise<void>
        buyProduct?: (productId: string) => Promise<{ jwsRepresentation?: string }>
      }
    } catch {
      return null
    }
  }, [])

  const localStoreKitSessionRef = useRef<Promise<void> | null>(null)
  const ensureLocalStoreKitSession = useCallback(async () => {
    if (!nativeStoreKitE2E) return

    const apiUrl = new URL(proxyEnv.API_URL)
    if (
      Platform.OS !== "ios" ||
      apiUrl.protocol !== "http:" ||
      apiUrl.hostname !== "localhost" ||
      !storeKitTestHelper?.prepareLocalSubscriptions
    ) {
      throw new Error("Native StoreKit E2E requires the local iOS test environment")
    }

    localStoreKitSessionRef.current ??= storeKitTestHelper
      .prepareLocalSubscriptions()
      .then((result) => {
        if (!result.enabled) {
          throw new Error("Native StoreKit E2E requires a STOREKIT_TESTING build")
        }
        logStoreKitE2E("session-ready")
      })
    await localStoreKitSessionRef.current
  }, [storeKitTestHelper])

  useEffect(() => {
    if (nativeStoreKitE2E) {
      void ensureLocalStoreKitSession().catch(() => logStoreKitE2E("session-unavailable"))
      return
    }
    void storeKitTestHelper?.prepareLocalSubscriptions?.().catch(() => {})
  }, [ensureLocalStoreKitSession, storeKitTestHelper])

  const {
    connected,
    subscriptions,
    availablePurchases,
    fetchProducts,
    finishTransaction,
    requestPurchase,
    restorePurchases,
    verifyPurchase: verifyStorePurchase,
  } = useIAP({
    onPurchaseError: (error) => {
      logStoreKitE2E(`purchase-error:${error.code}`)
      if (nativeStoreKitE2E) {
        localStoreKitSessionRef.current = (
          localStoreKitSessionRef.current ?? Promise.resolve()
        ).then(async () => {
          if (!storeKitTestHelper?.clearPurchaseError) {
            throw new Error("Native StoreKit E2E error recovery is unavailable")
          }
          await storeKitTestHelper.clearPurchaseError()
        })
        void localStoreKitSessionRef.current.catch(() =>
          logStoreKitE2E("purchase-error-recovery-failed"),
        )
      }
      setCurrentPurchaseError({
        code: error.code,
        message: error.message,
      })
    },
    onPurchaseSuccess: (purchase) => {
      logStoreKitE2E("purchase-success")
      setCurrentPurchase(purchase)
    },
  })

  useEffect(() => {
    availablePurchasesRef.current = availablePurchases
  }, [availablePurchases])

  const verifyPurchase = useCallback(
    async (purchase: Purchase) => {
      await ensureLocalStoreKitSession()
      const productId = purchase.productId
      let signedTransactionInfo = selectSignedTransactionInfo(purchase.purchaseToken)

      if (!signedTransactionInfo) {
        signedTransactionInfo = selectSignedTransactionInfo(
          await getTransactionJwsIOS(productId).catch(() => null),
        )
      }

      if (!signedTransactionInfo) {
        signedTransactionInfo = selectSignedTransactionInfo(
          await verifyStorePurchase({ apple: { sku: productId } })
            .then((result) =>
              "jwsRepresentation" in result ? result.jwsRepresentation : undefined,
            )
            .catch(() => undefined),
        )
      }

      if (nativeStoreKitE2E && !signedTransactionInfo) {
        throw new Error("Native StoreKit E2E requires a signed local transaction")
      }
      const response = await followClient.request<{
        code: number
        data: BillingSubscriptionResponse
      }>("/billing/apple/verify", {
        method: "POST",
        body: buildAppleVerificationRequest(purchase, signedTransactionInfo),
      })

      if (response.code !== 0) {
        throw new Error("Failed to verify Apple subscription")
      }
      logStoreKitE2E("server-verified")
    },
    [ensureLocalStoreKitSession, verifyStorePurchase],
  )

  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      !currentPurchase ||
      !isKnownAppleSubscriptionPurchase(currentPurchase, knownSubscriptionIds)
    ) {
      return
    }

    const transactionKey =
      currentPurchase.transactionId ||
      ("originalTransactionIdentifierIOS" in currentPurchase
        ? currentPurchase.originalTransactionIdentifierIOS
        : undefined) ||
      `${currentPurchase.id}:${currentPurchase.transactionDate}`

    if (processedTransactionsRef.current.has(transactionKey)) {
      return
    }

    processedTransactionsRef.current.add(transactionKey)
    setIsProcessingPurchase(true)
    setIsPurchasing(false)

    void (async () => {
      try {
        await verifyPurchase(currentPurchase)
        await finishTransaction({ purchase: currentPurchase })
        logStoreKitE2E("transaction-finished")
        await refreshBillingState()
      } catch (error) {
        processedTransactionsRef.current.delete(transactionKey)
        toast.error(
          error instanceof Error ? error.message : t("subscription.actions.upgrade_error"),
        )
      } finally {
        setIsProcessingPurchase(false)
      }
    })()
  }, [currentPurchase, finishTransaction, knownSubscriptionIds, t, verifyPurchase])

  useEffect(() => {
    if (!currentPurchaseError) {
      return
    }

    setIsPurchasing(false)
    setIsProcessingPurchase(false)

    if (currentPurchaseError.code === ErrorCode.UserCancelled) {
      return
    }

    toast.error(currentPurchaseError.message || t("subscription.actions.upgrade_error"))
  }, [currentPurchaseError, t])

  const loadSubscriptions = useCallback(
    async (skus: string[]) => {
      if (Platform.OS !== "ios" || skus.length === 0) {
        return
      }

      await ensureLocalStoreKitSession()
      await fetchProducts({ skus, type: "subs" })
      logStoreKitE2E("products-loaded")
    },
    [ensureLocalStoreKitSession, fetchProducts],
  )

  const requestSubscriptionPurchase = useCallback(
    async ({ sku, appAccountToken }: { sku: string; appAccountToken?: string | null }) => {
      if (Platform.OS !== "ios") {
        return
      }

      setIsPurchasing(true)
      try {
        await ensureLocalStoreKitSession()
        if (!nativeStoreKitE2E && storeKitTestHelper?.buyProduct) {
          setIsProcessingPurchase(true)
          try {
            const result = await storeKitTestHelper.buyProduct(sku)
            await followClient.request<{ code: number; data: BillingSubscriptionResponse }>(
              "/billing/apple/verify",
              {
                method: "POST",
                body: result?.jwsRepresentation
                  ? {
                      signedTransactionInfo: result.jwsRepresentation,
                    }
                  : {
                      productId: sku,
                    },
              },
            )
            await refreshBillingState()
            return
          } finally {
            setIsProcessingPurchase(false)
            setIsPurchasing(false)
          }
        }

        logStoreKitE2E("request-purchase")
        await requestPurchase({
          type: "subs",
          request: {
            apple: {
              sku,
              appAccountToken: appAccountToken ?? undefined,
              andDangerouslyFinishTransactionAutomatically: false,
            },
          },
        })
      } catch (error) {
        setIsPurchasing(false)
        throw error
      }
    },
    [ensureLocalStoreKitSession, requestPurchase, storeKitTestHelper],
  )

  const restoreSubscriptionPurchases = useCallback(async () => {
    if (Platform.OS !== "ios") {
      return
    }

    setIsRestoring(true)
    try {
      await ensureLocalStoreKitSession()
      await restorePurchases()
      logStoreKitE2E("restore-purchases")
      await new Promise((resolve) => setTimeout(resolve, 300))

      const restoredPurchases = availablePurchasesRef.current.filter((purchase) =>
        isKnownAppleSubscriptionPurchase(purchase, knownSubscriptionIds),
      )

      if (restoredPurchases.length === 0) {
        throw new Error(t("subscription.actions.restore_not_found"))
      }

      const sortedPurchases = [...restoredPurchases].sort((left, right) => {
        const leftExpires =
          ("expirationDateIOS" in left ? left.expirationDateIOS : undefined) ??
          left.transactionDate ??
          0
        const rightExpires =
          ("expirationDateIOS" in right ? right.expirationDateIOS : undefined) ??
          right.transactionDate ??
          0
        return rightExpires - leftExpires
      })

      let restored = false
      for (const purchase of sortedPurchases) {
        try {
          await verifyPurchase(purchase)
          restored = true
          break
        } catch {
          continue
        }
      }

      if (!restored) {
        throw new Error(t("subscription.actions.restore_error"))
      }

      await refreshBillingState()
      toast.success(t("subscription.actions.restore_success"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("subscription.actions.restore_error"))
    } finally {
      setIsRestoring(false)
    }
  }, [ensureLocalStoreKitSession, knownSubscriptionIds, restorePurchases, t, verifyPurchase])

  const contextValue = useMemo<AppleIAPContextValue>(
    () => ({
      connected,
      subscriptions,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
    }),
    [
      connected,
      subscriptions,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
    ],
  )

  return <AppleIAPContext value={contextValue}>{children}</AppleIAPContext>
}

export const useAppleIAP = () => {
  const context = use(AppleIAPContext)
  if (!context) {
    throw new Error("useAppleIAP must be used within AppleIAPProvider")
  }
  return context
}
