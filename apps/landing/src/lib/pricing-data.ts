const PRICING_API_URL = 'https://api.follow.is/status/configs'
const isDevelopment = process.env.NODE_ENV !== 'production'

export type PricingPlanLimit = {
  MAX_AI_TASKS: number
  AI_CREDIT: number
  AI_MODEL_SELECTION: 'none' | 'curated' | 'high_performance'
  AI_BRING_YOUR_OWN_KEY: boolean
  MAX_AI_ENTRY_SUMMARY_PER_DAY: number
  MAX_AI_ENTRY_TRANSLATION_PER_DAY: number
  MAX_AI_TEXT_TO_SPEECH_PER_DAY: number
  MAX_SUBSCRIPTIONS: number
  MAX_RSSHUB_SUBSCRIPTIONS: number
  PRIVATE_SUBSCRIPTION: boolean
  MAX_INBOXES: number
  MAX_LISTS: number
  MAX_ACTIONS: number
  INTEGRATION_SUPPORTED: boolean
  SECURE_IMAGE_PROXY: boolean
  PRIORITY_SUPPORT: boolean | string[]
  BOOSTS: string
}

export type PricingPlan = {
  planID?: string
  name: string
  priceInDollars: number
  priceInDollarsInDiscount?: number
  priceInDollarsAnnual: number
  priceInDollarsInDiscountAnnual?: number
  discountDescription?: string
  upgradeButtonText?: string
  isPopular?: boolean
  isComingSoon?: boolean
  tier: number
  limit: PricingPlanLimit
  role: 'free' | 'basic' | 'plus' | 'pro' | 'admin'
}

type StatusConfigsResponse = {
  code: number
  data: {
    PAYMENT_PLAN_LIST: PricingPlan[]
  }
}

const PRICING_FALLBACK: PricingPlan[] = [
  {
    name: 'Free',
    priceInDollars: 0,
    priceInDollarsAnnual: 0,
    tier: 0,
    role: 'free',
    limit: {
      MAX_AI_TASKS: 0,
      AI_CREDIT: 0,
      AI_MODEL_SELECTION: 'none',
      AI_BRING_YOUR_OWN_KEY: false,
      MAX_AI_ENTRY_SUMMARY_PER_DAY: 3,
      MAX_AI_ENTRY_TRANSLATION_PER_DAY: 0,
      MAX_AI_TEXT_TO_SPEECH_PER_DAY: 1,
      MAX_SUBSCRIPTIONS: 150,
      MAX_RSSHUB_SUBSCRIPTIONS: 30,
      PRIVATE_SUBSCRIPTION: false,
      MAX_INBOXES: 1,
      MAX_LISTS: 1,
      MAX_ACTIONS: 1,
      INTEGRATION_SUPPORTED: false,
      SECURE_IMAGE_PROXY: false,
      PRIORITY_SUPPORT: false,
      BOOSTS: '0',
    },
  },
  {
    planID: 'basic',
    name: 'Basic',
    priceInDollars: 4.99,
    priceInDollarsAnnual: 49.99,
    upgradeButtonText: 'Start Free Trial',
    tier: 0.5,
    role: 'basic',
    limit: {
      MAX_AI_TASKS: 0,
      AI_CREDIT: 0,
      AI_MODEL_SELECTION: 'none',
      AI_BRING_YOUR_OWN_KEY: false,
      MAX_AI_ENTRY_SUMMARY_PER_DAY: 30,
      MAX_AI_ENTRY_TRANSLATION_PER_DAY: 300,
      MAX_AI_TEXT_TO_SPEECH_PER_DAY: 1,
      MAX_SUBSCRIPTIONS: 1000,
      MAX_RSSHUB_SUBSCRIPTIONS: 200,
      PRIVATE_SUBSCRIPTION: true,
      MAX_INBOXES: 10,
      MAX_LISTS: 5,
      MAX_ACTIONS: 5,
      INTEGRATION_SUPPORTED: true,
      SECURE_IMAGE_PROXY: true,
      PRIORITY_SUPPORT: ['Email'],
      BOOSTS: '0',
    },
  },
  {
    planID: 'plus',
    name: 'Plus',
    priceInDollars: 9.99,
    priceInDollarsAnnual: 99.99,
    upgradeButtonText: 'Start Free Trial',
    isPopular: true,
    tier: 1,
    role: 'plus',
    limit: {
      MAX_AI_TASKS: Number.MAX_SAFE_INTEGER,
      AI_CREDIT: 5_000_000,
      AI_MODEL_SELECTION: 'curated',
      AI_BRING_YOUR_OWN_KEY: true,
      MAX_AI_ENTRY_SUMMARY_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_AI_ENTRY_TRANSLATION_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_AI_TEXT_TO_SPEECH_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_SUBSCRIPTIONS: 2500,
      MAX_RSSHUB_SUBSCRIPTIONS: 500,
      PRIVATE_SUBSCRIPTION: true,
      MAX_INBOXES: 20,
      MAX_LISTS: 15,
      MAX_ACTIONS: 10,
      INTEGRATION_SUPPORTED: true,
      SECURE_IMAGE_PROXY: true,
      PRIORITY_SUPPORT: ['Email', 'Discord'],
      BOOSTS: '×10',
    },
  },
  {
    planID: 'pro',
    name: 'Pro',
    priceInDollars: 99.99,
    priceInDollarsAnnual: 999.99,
    upgradeButtonText: 'Start Free Trial',
    tier: 2,
    role: 'pro',
    limit: {
      MAX_AI_TASKS: Number.MAX_SAFE_INTEGER,
      AI_CREDIT: 50_000_000,
      AI_MODEL_SELECTION: 'high_performance',
      AI_BRING_YOUR_OWN_KEY: true,
      MAX_AI_ENTRY_SUMMARY_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_AI_ENTRY_TRANSLATION_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_AI_TEXT_TO_SPEECH_PER_DAY: Number.MAX_SAFE_INTEGER,
      MAX_SUBSCRIPTIONS: 25000,
      MAX_RSSHUB_SUBSCRIPTIONS: 5000,
      PRIVATE_SUBSCRIPTION: true,
      MAX_INBOXES: 200,
      MAX_LISTS: 100,
      MAX_ACTIONS: 100,
      INTEGRATION_SUPPORTED: true,
      SECURE_IMAGE_PROXY: true,
      PRIORITY_SUPPORT: ['Email', 'Discord'],
      BOOSTS: '×100',
    },
  },
]

export const FEATURE_ORDER: Array<keyof PricingPlanLimit> = [
  'MAX_SUBSCRIPTIONS',
  'MAX_LISTS',
  'MAX_INBOXES',
  'MAX_ACTIONS',
  'MAX_AI_ENTRY_SUMMARY_PER_DAY',
  'MAX_AI_ENTRY_TRANSLATION_PER_DAY',
  'MAX_AI_TEXT_TO_SPEECH_PER_DAY',
  'AI_MODEL_SELECTION',
  'AI_BRING_YOUR_OWN_KEY',
  'BOOSTS',
  'PRIORITY_SUPPORT',
  'PRIVATE_SUBSCRIPTION',
  'MAX_RSSHUB_SUBSCRIPTIONS',
  'SECURE_IMAGE_PROXY',
  'INTEGRATION_SUPPORTED',
  'AI_CREDIT',
  'MAX_AI_TASKS',
]

export const fetchPricingPlans = async (): Promise<PricingPlan[]> => {
  if (isDevelopment) {
    return PRICING_FALLBACK
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(PRICING_API_URL, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Failed to fetch pricing plans: ${response.status}`)
    }

    const json = (await response.json()) as StatusConfigsResponse
    const plans = json.data?.PAYMENT_PLAN_LIST ?? []
    return plans.length > 0 ? plans : PRICING_FALLBACK
  } catch {
    return PRICING_FALLBACK
  }
}
