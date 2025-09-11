name: "Enhanced AI Usage Observability Frontend"
description: |
Frontend implementation for enhanced AI token usage observability with real-time
tracking, predictive analytics, and user-centered visualizations. Integrates with
the backend API from enhanced-ai-usage-observability.md to provide comprehensive
usage insights in both AI settings tab and dedicated analytics page.

## Purpose

Implement comprehensive React-based frontend for AI usage observability that transforms raw token statistics into actionable user insights through intuitive visualizations, real-time feedback, and predictive warnings.

## Core Principles

1. **Component Reusability**: Build modular components following Follow's SettingBuilder patterns
2. **Real-time Updates**: Use React Query for efficient data synchronization and caching
3. **Progressive Disclosure**: Simple overview in AI tab, detailed analysis in separate page
4. **Visual Clarity**: Use charts and progress indicators for immediate comprehension
5. **Mobile Responsive**: Ensure consistent experience across desktop and mobile

---

## Goal

Create React frontend components that consume enhanced AI usage analytics APIs to provide users with real-time session tracking, usage pattern insights, predictive warnings, and optimization recommendations through intuitive visualizations.

## Why

- **User Empowerment**: Transform technical token counts into actionable usage insights
- **Cost Awareness**: Provide real-time feedback on current session costs and efficiency
- **Proactive Management**: Warn users before hitting rate limits through predictive analytics
- **Usage Optimization**: Help users understand and optimize their AI consumption patterns
- **Seamless Integration**: Integrate naturally into existing AI settings workflow

## What

Frontend implementation with:

1. **AI Tab Integration**: Compact usage analysis section in AI settings
2. **Detailed Analytics Page**: Enhanced token-usage page with comprehensive charts
3. **Real-Time Tracking**: Live session usage and progress indicators
4. **Predictive Warnings**: Visual alerts for approaching rate limits
5. **Usage Visualizations**: Charts for trends, feature distribution, and model efficiency

### Success Criteria

- [ ] AI Tab shows simplified usage overview with key metrics and warnings
- [ ] Token usage page displays comprehensive analytics with interactive charts
- [ ] Real-time session tracking updates every 10 seconds
- [ ] Predictive warnings appear when rate limit risk is detected
- [ ] Charts render usage patterns, feature distribution, and efficiency comparisons
- [ ] Mobile responsive design maintains usability on smaller screens
- [ ] Components follow existing Follow UI patterns and design system
- [ ] All user-facing text is properly internationalized

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: apps/desktop/layer/renderer/src/modules/settings/tabs/ai.tsx
  why: Current AI settings page structure and SettingBuilder pattern

- file: apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage.tsx
  why: Existing token usage component to enhance and reference

- file: apps/desktop/layer/renderer/src/modules/ai-task/query.ts
  why: React Query patterns and query key hierarchies used in Follow

- file: apps/desktop/layer/renderer/src/modules/settings/tabs/ai/mcp/MCPServicesSection.tsx
  why: Component structure patterns, useQuery usage, error handling

- file: apps/desktop/layer/renderer/src/modules/settings/tabs/ai/PanelStyleSection.tsx
  why: SettingTabbedSegment usage and section component patterns

- file: packages/internal/components/src/ui/progress/index.tsx
  why: Progress component for usage indicators

- file: apps/desktop/layer/renderer/src/lib/api-client.ts
  why: followClient usage and API integration patterns

- doc: https://recharts.org/en-US/api
  section: LineChart, PieChart, BarChart components
  critical: Follow doesn't have charting library - need to add recharts

- doc: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
  section: Query key hierarchies and best practices
  critical: Follow uses hierarchical query keys pattern

- doc: https://react-i18next.com/latest/using-with-hooks
  section: useTranslation hook usage
  critical: All user-facing text must be internationalized
```

### Current Codebase tree

```bash
apps/desktop/layer/renderer/src/modules/settings/tabs/
├── ai.tsx                           # Main AI settings page with SettingBuilder
├── token-usage.tsx                  # Current token usage implementation
└── ai/
    ├── index.ts                     # Exports AI-related components
    ├── PanelStyleSection.tsx        # Example section component pattern
    ├── PersonalizePromptSection.tsx # Example section component pattern
    └── mcp/MCPServicesSection.tsx   # Complex section with React Query

apps/desktop/layer/renderer/src/modules/ai-task/
└── query.ts                        # React Query patterns and conventions

packages/internal/components/src/ui/
├── progress/index.tsx               # Progress bars and indicators
├── card/index.tsx                   # Card containers
├── tabs/index.tsx                   # Tab navigation
└── [other UI components...]
```

### Desired Codebase tree with files to be added and responsibility

```bash
apps/desktop/layer/renderer/src/modules/settings/tabs/
├── ai.tsx                           # MODIFIED: Add UsageAnalysisSection
├── token-usage.tsx                  # MODIFIED: Enhanced with analytics
└── ai/
    ├── index.ts                     # MODIFIED: Export new usage components
    └── usage/                       # NEW: Usage observability components
        ├── UsageAnalysisSection.tsx # AI tab simplified usage overview
        ├── hooks/
        │   ├── useEnhancedTokenUsage.ts  # Enhanced config API hook
        │   ├── useUsageAnalytics.ts      # Analytics API hook
        │   ├── useSessionTracking.ts     # Session tracking hook
        │   └── index.ts                  # Hook exports
        └── components/
            ├── UsageProgressRing.tsx     # Circular progress component
            ├── SessionStatusCard.tsx     # Active session display
            ├── UsageWarningBanner.tsx    # Predictive warning alerts
            ├── QuickInsights.tsx         # Key metrics display
            └── index.ts                  # Component exports

apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/
├── index.tsx                        # MODIFIED: Export enhanced components
├── TokenUsageEnhanced.tsx           # NEW: Enhanced analytics page
├── components/
│   ├── UsageTrendChart.tsx          # Line chart for usage trends
│   ├── FeatureDistributionChart.tsx # Pie chart for feature breakdown
│   ├── ModelEfficiencyChart.tsx     # Bar chart for model comparison
│   ├── TimePatternAnalysis.tsx      # Time-based usage patterns
│   ├── PredictiveInsights.tsx       # Insights and recommendations
│   ├── RealTimeMetrics.tsx          # Live usage dashboard
│   └── index.ts                     # Chart component exports
└── styles/
    └── charts.module.css            # Chart-specific styles

apps/desktop/layer/renderer/src/queries/
└── ai-analytics.ts                  # NEW: Centralized analytics query logic
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Project-specific patterns and constraints
// REACT_QUERY: Use hierarchical query keys following aiTaskKeys pattern
// REACT_QUERY: Extract data with data?.data pattern, handle loading/error states
// REACT_QUERY: Use proper cache invalidation on mutations
// COMPONENTS: Import UI components from @follow/components/ui/*
// COMPONENTS: Use SettingBuilder for settings pages, SettingTabbedSegment for options
// API: Use followClient.api.* pattern, not direct fetch
// I18N: All user-facing strings must use useTranslation hook
// STYLING: Use Tailwind with UIKit colors (text-text, bg-fill, etc.)
// STYLING: Follow mobile-first responsive design patterns
// ICONS: Use i-mgc-* prefix for MingCute icons, i-mingcute-* as fallback
// MOTION: Use m. instead of motion. for Framer Motion components
// CHARTS: No existing chart library - need to add recharts to dependencies
// MODALS: Use useDialog and useModalStack for modal interactions
// TOASTS: Use toast from "sonner" for notifications
// STATE: Settings state managed through Jotai atoms
// ROUTES: Use React Router Link for navigation
// ERROR_HANDLING: Follow existing error boundary patterns
```

## Implementation Blueprint

### Data models and structure

Enhanced React Query hooks and TypeScript interfaces:

```typescript
// apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/hooks/useEnhancedTokenUsage.ts
export interface EnhancedTokenUsage {
  defaultModel: string
  availableModels: string[]
  modelBillingStrategy: Record<string, number>
  rateLimit: {
    maxTokens: number
    currentTokens: number
    remainingTokens: number
    windowDuration: number
    windowResetTime: number
    // Enhanced fields
    usageRate: number
    projectedLimitTime: number | null
    warningLevel: "safe" | "moderate" | "high" | "critical"
  }
  usage: {
    total: number
    used: number
    remaining: number
    resetAt: string
    // Enhanced fields
    avgTokensPerSession: number
    avgSessionDuration: number
    mostUsedFeature: string
    efficiencyScore: number
  }
  currentSession: {
    sessionId: string | null
    tokensUsed: number
    messageCount: number
    duration: number
    isActive: boolean
  }
  usageHistory: Array<{
    id: string
    createdAt: Date
    changes: number
    comment: string | null
    operationType: string | null
    modelUsed: string | null
    sessionId: string | null
  }>
}

// apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/hooks/useUsageAnalytics.ts
export interface UsageAnalytics {
  patterns: {
    daily: Array<{
      date: string
      totalTokens: number
      operationCount: number
      peakHour: number | null
    }>
    byOperation: Array<{
      operationType: string
      totalTokens: number
      operationCount: number
      percentage: number
      avgTokensPerOperation: number
    }>
    byModel: Array<{
      model: string
      totalTokens: number
      operationCount: number
      percentage: number
      avgEfficiency: number
    }>
  }
  insights: {
    usageTrend: "increasing" | "decreasing" | "stable"
    projectedMonthlyUsage: number
    recommendations: string[]
    efficiencyTips: string[]
  }
  timePatterns: {
    peakHours: number[]
    peakDays: number[]
    avgSessionDuration: number
    avgTokensPerSession: number
  }
}

// Query keys following aiTaskKeys pattern
export const aiAnalyticsKeys = {
  all: ["ai-analytics"] as const,
  config: () => [...aiAnalyticsKeys.all, "config"] as const,
  analytics: () => [...aiAnalyticsKeys.all, "analytics"] as const,
  analyticsWithDays: (days: number) => [...aiAnalyticsKeys.analytics(), days] as const,
  session: () => [...aiAnalyticsKeys.all, "session"] as const,
  sessionCurrent: () => [...aiAnalyticsKeys.session(), "current"] as const,
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: Add recharts dependency for data visualization
MODIFY package.json (apps/desktop/):
  - ADD "recharts": "^2.10.0" to dependencies
  - RUN pnpm install to install charting library

Task 2: Create AI analytics query hooks
CREATE apps/desktop/layer/renderer/src/queries/ai-analytics.ts:
  - IMPLEMENT hierarchical query keys following aiTaskKeys pattern
  - EXPORT useEnhancedTokenUsage, useUsageAnalytics, useSessionTracking hooks
  - USE followClient.api pattern for API calls
  - HANDLE loading states and error cases

Task 3: Create usage progress ring component
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/components/UsageProgressRing.tsx:
  - IMPLEMENT circular SVG progress indicator
  - SUPPORT different sizes (sm/md/lg) and color coding
  - FOLLOW UIKit color system for status indication

Task 4: Create session status components
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/components/SessionStatusCard.tsx:
  - DISPLAY active session information when available
  - SHOW real-time token usage and message count
  - USE card component from @follow/components/ui/card

CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/components/UsageWarningBanner.tsx:
  - IMPLEMENT predictive warning display
  - COLOR-CODE warnings by severity level
  - SHOW projected limit time and usage rate

Task 5: Create simplified usage analysis section
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/UsageAnalysisSection.tsx:
  - IMPLEMENT compact overview for AI settings tab
  - USE UsageProgressRing and SessionStatusCard components
  - INCLUDE "View Details" link to full analytics page
  - FOLLOW SettingTabbedSegment patterns from existing sections

Task 6: Create chart components for detailed analytics
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/UsageTrendChart.tsx:
  - USE recharts LineChart for 30-day usage trends
  - IMPLEMENT responsive container and proper tooltips
  - STYLE using Tailwind and UIKit colors

CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/FeatureDistributionChart.tsx:
  - USE recharts PieChart for feature usage breakdown
  - ADD custom legend with percentages
  - IMPLEMENT hover interactions

CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/ModelEfficiencyChart.tsx:
  - USE recharts BarChart for model efficiency comparison
  - SHOW tokens per operation efficiency
  - COLOR-CODE by efficiency levels

Task 7: Create comprehensive analytics page
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/TokenUsageEnhanced.tsx:
  - IMPLEMENT tabbed interface with overview/patterns/efficiency/history
  - USE chart components for visualizations
  - INCLUDE real-time metrics dashboard
  - ADD predictive insights and recommendations section

Task 8: Create time pattern analysis components
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/TimePatternAnalysis.tsx:
  - DISPLAY peak usage hours and days
  - SHOW usage patterns and habits
  - PROVIDE optimization suggestions based on patterns

CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/PredictiveInsights.tsx:
  - RENDER usage trend analysis
  - DISPLAY projected monthly usage
  - SHOW personalized recommendations and tips

Task 9: Integrate usage section into AI settings
MODIFY apps/desktop/layer/renderer/src/modules/settings/tabs/ai.tsx:
  - IMPORT UsageAnalysisSection component
  - ADD to SettingBuilder array after existing sections
  - INCLUDE proper title and divider

MODIFY apps/desktop/layer/renderer/src/modules/settings/tabs/ai/index.ts:
  - EXPORT UsageAnalysisSection from new usage module

Task 10: Enhance existing token usage page
MODIFY apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage.tsx:
  - REPLACE current implementation with TokenUsageEnhanced
  - MAINTAIN backward compatibility with existing route
  - ADD proper error boundaries and loading states

Task 11: Add internationalization support
CREATE locales/en/ai.json (add new keys):
  - ADD usage_analysis.* keys for simplified section
  - ADD analytics.* keys for detailed page
  - ADD insights.* keys for recommendations and warnings

CREATE similar entries in locales/zh-CN/ai.json and locales/ja.json

Task 12: Add responsive mobile support
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/styles/charts.module.css:
  - ADD mobile-responsive chart styles
  - IMPLEMENT collapsible sections for mobile
  - ENSURE touch-friendly interactions

Task 13: Implement real-time updates
MODIFY all query hooks:
  - ADD refetchInterval: 30000 for config data
  - ADD refetchInterval: 10000 for session data
  - IMPLEMENT proper error retry logic

Task 14: Add loading and error states
ENHANCE all components:
  - ADD skeleton loading states using @follow/components/ui/skeleton
  - IMPLEMENT error boundaries with retry mechanisms
  - SHOW proper fallback UI when data unavailable

Task 15: Create comprehensive component exports
CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/index.ts:
  - EXPORT all usage-related components and hooks
  - MAINTAIN clean import structure

CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/index.ts:
  - EXPORT all chart and analytics components

Task 16: Add interactive features
ENHANCE chart components:
  - ADD click interactions for drill-down views
  - IMPLEMENT brush selection for time range filtering
  - ADD export functionality for usage reports

Task 17: Implement accessibility features
ENHANCE all components:
  - ADD proper ARIA labels and descriptions
  - ENSURE keyboard navigation support
  - IMPLEMENT high contrast mode compatibility
  - ADD screen reader support for charts
```

### Per task pseudocode as needed

```typescript
// Task 2: AI Analytics Query Hooks
// apps/desktop/layer/renderer/src/queries/ai-analytics.ts

import { useQuery } from "@tanstack/react-query"
import { followClient } from "~/lib/api-client"

export const aiAnalyticsKeys = {
  all: ["ai-analytics"] as const,
  config: () => [...aiAnalyticsKeys.all, "config"] as const,
  analytics: () => [...aiAnalyticsKeys.all, "analytics"] as const,
  analyticsWithDays: (days: number) => [...aiAnalyticsKeys.analytics(), days] as const,
  session: () => [...aiAnalyticsKeys.all, "session"] as const,
  sessionCurrent: () => [...aiAnalyticsKeys.session(), "current"] as const,
}

export const useEnhancedTokenUsage = (options = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: aiAnalyticsKeys.config(),
    queryFn: async () => {
      const res = await followClient.api.ai.config()
      return res
    },
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  })
  return { data: data?.data, isLoading, error }
}

export const useUsageAnalytics = (days: number = 30) => {
  const { data, isLoading, error } = useQuery({
    queryKey: aiAnalyticsKeys.analyticsWithDays(days),
    queryFn: async () => {
      const res = await followClient.api.ai.analytics({ days })
      return res
    },
    refetchInterval: 60000, // 1 minute
    ...options,
  })
  return { data: data?.data, isLoading, error }
}

// Task 5: Usage Analysis Section for AI Tab
// apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/UsageAnalysisSection.tsx

import { Card, CardContent } from "@follow/components/ui/card"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { UsageProgressRing } from "./components/UsageProgressRing"
import { SessionStatusCard } from "./components/SessionStatusCard"
import { UsageWarningBanner } from "./components/UsageWarningBanner"
import { useEnhancedTokenUsage } from "~/queries/ai-analytics"

export const UsageAnalysisSection = ({ compact = false }) => {
  const { t } = useTranslation("ai")
  const { data: config, isLoading } = useEnhancedTokenUsage()

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />
  }

  if (!config) return null

  const { usage, rateLimit, currentSession } = config
  const usagePercentage = usage.total === 0 ? 0 : (usage.used / usage.total) * 100

  return (
    <div className="space-y-4">
      {/* Warning banner for critical states */}
      {rateLimit.warningLevel !== "safe" && (
        <UsageWarningBanner
          level={rateLimit.warningLevel}
          projectedLimitTime={rateLimit.projectedLimitTime}
          usageRate={rateLimit.usageRate}
        />
      )}

      {/* Main usage card */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text">
              {t("usage_analysis.title")}
            </h3>
            <Link
              to="/settings/token-usage"
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {t("usage_analysis.view_details")} →
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <UsageProgressRing
              percentage={usagePercentage}
              size="md"
            />

            <div className="flex-1 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-text">
                  {formatTokenCount(rateLimit.remainingTokens).value}
                  {formatTokenCount(rateLimit.remainingTokens).unit}
                </span>
                <span className="text-sm text-text-secondary">
                  {t("usage_analysis.tokens_remaining")}
                </span>
              </div>

              <div className="text-xs text-text-tertiary">
                {formatTokenCount(usage.used).value}{formatTokenCount(usage.used).unit} /
                {formatTokenCount(usage.total).value}{formatTokenCount(usage.total).unit} used
              </div>

              <div className="text-xs text-text-secondary">
                {t("usage_analysis.resets_in")} {formatTimeRemaining(rateLimit.windowResetTime - Date.now())}
              </div>
            </div>
          </div>

          {/* Current session if active */}
          {currentSession?.isActive && (
            <SessionStatusCard session={currentSession} className="mt-4" />
          )}

          {/* Quick insights */}
          {!compact && (
            <div className="mt-4 space-y-2">
              <QuickInsights
                mostUsedFeature={usage.mostUsedFeature}
                efficiencyScore={usage.efficiencyScore}
                avgSessionDuration={usage.avgSessionDuration}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Task 6: Usage Trend Chart
// apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/components/UsageTrendChart.tsx

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@follow/components/ui/card"

interface UsageTrendChartProps {
  data: Array<{
    date: string
    totalTokens: number
    operationCount: number
  }>
}

export const UsageTrendChart = ({ data }: UsageTrendChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
            <XAxis
              dataKey="date"
              className="text-text-secondary text-sm"
            />
            <YAxis className="text-text-secondary text-sm" />
            <Tooltip
              formatter={(value, name) => [
                name === 'totalTokens' ? `${value.toLocaleString()} tokens` : `${value} operations`,
                name === 'totalTokens' ? 'Tokens Used' : 'Operations'
              ]}
              contentStyle={{
                backgroundColor: 'rgb(var(--color-fill))',
                border: '1px solid rgb(var(--color-fill-secondary))',
                borderRadius: '6px'
              }}
            />
            <Line
              type="monotone"
              dataKey="totalTokens"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              dot={{ fill: "rgb(59, 130, 246)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: "rgb(59, 130, 246)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Task 7: Enhanced Token Usage Page
// apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/TokenUsageEnhanced.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@follow/components/ui/tabs"
import { useEnhancedTokenUsage, useUsageAnalytics } from "~/queries/ai-analytics"
import { UsageTrendChart } from "./components/UsageTrendChart"
import { FeatureDistributionChart } from "./components/FeatureDistributionChart"
import { ModelEfficiencyChart } from "./components/ModelEfficiencyChart"
import { RealTimeMetrics } from "./components/RealTimeMetrics"

export const TokenUsageEnhanced = () => {
  const { t } = useTranslation("ai")
  const { data: config, isLoading: configLoading } = useEnhancedTokenUsage()
  const { data: analytics, isLoading: analyticsLoading } = useUsageAnalytics(30)

  if (configLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="i-mgc-loading-3-cute-re animate-spin size-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-time metrics overview */}
      <RealTimeMetrics config={config} />

      {/* Predictive warnings */}
      {config.rateLimit.projectedLimitTime && (
        <UsageWarningBanner
          level={config.rateLimit.warningLevel}
          projectedLimitTime={config.rateLimit.projectedLimitTime}
          usageRate={config.rateLimit.usageRate}
          detailed={true}
        />
      )}

      {/* Detailed analytics tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("analytics.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="patterns">{t("analytics.tabs.patterns")}</TabsTrigger>
          <TabsTrigger value="efficiency">{t("analytics.tabs.efficiency")}</TabsTrigger>
          <TabsTrigger value="history">{t("analytics.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <UsageTrendChart data={analytics?.patterns.daily || []} />

          <div className="grid gap-4 md:grid-cols-2">
            <FeatureDistributionChart data={analytics?.patterns.byOperation || []} />
            <ModelEfficiencyChart data={analytics?.patterns.byModel || []} />
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <TimePatternAnalysis
            timePatterns={analytics?.timePatterns}
            insights={analytics?.insights}
          />
        </TabsContent>

        <TabsContent value="efficiency">
          <ModelEfficiencyChart
            data={analytics?.patterns.byModel || []}
            detailed={true}
          />
        </TabsContent>

        <TabsContent value="history">
          <UsageHistoryTable history={config?.usageHistory || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - add: "recharts": "^2.10.0" to package.json
  - verify: @tanstack/react-query version compatibility
  - ensure: React 19 compatibility with recharts

API_INTEGRATION:
  - endpoints: /ai/chat/config (enhanced), /ai/analytics, /ai/session/current
  - pattern: followClient.api.ai.* for all API calls
  - response: Extract data with data?.data pattern

UI_COMPONENTS:
  - use: @follow/components/ui/* for all UI primitives
  - follow: UIKit color system (text-text, bg-fill, etc.)
  - icons: i-mgc-* prefix for MingCute icons

SETTINGS_INTEGRATION:
  - modify: apps/desktop/layer/renderer/src/modules/settings/tabs/ai.tsx
  - pattern: Add to SettingBuilder array following existing structure
  - export: Update ai/index.ts with new components

ROUTES:
  - existing: /settings/token-usage enhanced with new components
  - navigation: Use React Router Link for internal navigation

STATE_MANAGEMENT:
  - queries: React Query for server state
  - settings: Jotai atoms for client settings (if needed)
  - cache: Proper invalidation on data mutations
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
pnpm lint --fix                                          # ESLint auto-fix
pnpm typecheck                                          # TypeScript checking
pnpm --filter=@follow/desktop typecheck                 # Desktop specific check

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Component Tests

```typescript
// CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage/__tests__/UsageAnalysisSection.test.tsx
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { UsageAnalysisSection } from "../UsageAnalysisSection"

const mockConfig = {
  usage: { used: 500000, total: 1000000, efficiencyScore: 85 },
  rateLimit: { remainingTokens: 500000, warningLevel: "safe" },
  currentSession: { isActive: false },
}

jest.mock("~/queries/ai-analytics", () => ({
  useEnhancedTokenUsage: () => ({ data: mockConfig, isLoading: false }),
}))

describe('UsageAnalysisSection', () => {
  it('renders usage overview correctly', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <UsageAnalysisSection />
      </QueryClientProvider>
    )

    expect(screen.getByText("Token Usage")).toBeInTheDocument()
    expect(screen.getByText("View Details →")).toBeInTheDocument()
    expect(screen.getByText("500K remaining")).toBeInTheDocument()
  })

  it('shows warning banner for critical states', () => {
    const criticalConfig = {
      ...mockConfig,
      rateLimit: { ...mockConfig.rateLimit, warningLevel: "critical" }
    }

    jest.mocked(useEnhancedTokenUsage).mockReturnValue({
      data: criticalConfig,
      isLoading: false
    })

    render(
      <QueryClientProvider client={queryClient}>
        <UsageAnalysisSection />
      </QueryClientProvider>
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})

// CREATE apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage/__tests__/TokenUsageEnhanced.test.tsx
describe('TokenUsageEnhanced', () => {
  it('renders analytics tabs correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TokenUsageEnhanced />
      </QueryClientProvider>
    )

    expect(screen.getByRole("tablist")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Patterns" })).toBeInTheDocument()
  })

  it('displays charts when data is available', async () => {
    const mockAnalytics = {
      patterns: {
        daily: [{ date: "2024-01-01", totalTokens: 1000, operationCount: 5 }],
        byOperation: [{ operationType: "chat", totalTokens: 800, percentage: 80 }],
        byModel: [{ model: "gpt-4", totalTokens: 600, avgEfficiency: 120 }],
      }
    }

    jest.mocked(useUsageAnalytics).mockReturnValue({
      data: mockAnalytics,
      isLoading: false
    })

    render(
      <QueryClientProvider client={queryClient}>
        <TokenUsageEnhanced />
      </QueryClientProvider>
    )

    expect(screen.getByText("Usage Trends")).toBeInTheDocument()
  })
})
```

```bash
# Run component tests:
pnpm test -- apps/desktop/layer/renderer/src/modules/settings/tabs/ai/usage
pnpm test -- apps/desktop/layer/renderer/src/modules/settings/tabs/token-usage
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test

```bash
# Start the development server
pnpm --filter=@follow/desktop dev:web

# Test AI settings page integration
# Navigate to http://localhost:5173/settings/ai
# Expected: New "Token Usage" section visible with progress ring and metrics

# Test detailed analytics page
# Navigate to http://localhost:5173/settings/token-usage
# Expected: Enhanced page with tabs, charts, and real-time metrics

# Test responsive design
# Resize browser window to mobile dimensions
# Expected: Charts stack vertically, components remain usable

# Test real-time updates
# Keep page open for 30 seconds, observe data refresh
# Expected: Usage data updates automatically
```

### Level 4: Chart Rendering Validation

```bash
# Test chart libraries
# Open browser developer tools, check for console errors
# Expected: No recharts-related errors, proper chart rendering

# Test chart interactions
# Hover over chart elements, verify tooltips appear
# Click on legend items, verify chart responds
# Expected: Interactive elements work smoothly
```

### Level 5: API Integration Validation

```bash
# Test API calls in Network tab
# Navigate to enhanced pages, verify API requests
# Expected:
# - GET /ai/chat/config calls successfully
# - GET /ai/analytics calls successfully
# - GET /ai/session/current calls when needed
# - Proper error handling for failed requests
```

## Final validation Checklist

- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] Recharts dependency installed: `pnpm list recharts`
- [ ] AI settings page shows usage section: Navigate to /settings/ai
- [ ] Token usage page enhanced with charts: Navigate to /settings/token-usage
- [ ] Real-time updates working: Observe 30-second refresh intervals
- [ ] Charts render correctly: All visualizations display properly
- [ ] Mobile responsive: Components work on smaller screens
- [ ] Predictive warnings appear: Test with high usage scenarios
- [ ] Session tracking displays: Active sessions show correctly
- [ ] Navigation works: Links between simple/detailed views function
- [ ] Internationalization complete: All text uses translation keys
- [ ] Error states handled: Network failures show appropriate UI
- [ ] Loading states smooth: Skeleton screens display during data fetch
- [ ] Accessibility compliant: Screen reader and keyboard navigation work

---

## Anti-Patterns to Avoid

- ❌ Don't fetch chart data on every render - use React Query caching
- ❌ Don't ignore mobile responsive design - ensure charts work on small screens
- ❌ Don't hardcode colors - use UIKit color system throughout
- ❌ Don't skip loading states - users need visual feedback during data fetch
- ❌ Don't break existing AI settings layout - integrate cleanly with SettingBuilder
- ❌ Don't forget internationalization - all user text must use useTranslation
- ❌ Don't implement custom query logic - follow existing React Query patterns
- ❌ Don't ignore error boundaries - handle API failures gracefully
- ❌ Don't make charts inaccessible - include proper ARIA labels
- ❌ Don't pollute global styles - scope chart styles appropriately

## Confidence Score: 8/10

This PRP provides comprehensive context for implementing enhanced AI usage observability frontend with:

- ✅ Complete analysis of existing Follow frontend patterns and conventions
- ✅ Detailed component hierarchy with specific file structure and responsibilities
- ✅ React Query integration following project's established patterns
- ✅ Chart library integration with proper responsive design considerations
- ✅ Comprehensive testing strategy covering unit and integration scenarios
- ✅ Step-by-step implementation tasks with proper dependency management
- ✅ Clear validation steps with specific commands and expected outcomes
- ✅ Internationalization requirements and integration patterns

The implementation should succeed with high confidence given the detailed context, existing codebase analysis, and thorough validation approach. The -2 points account for the complexity of chart library integration and potential responsive design edge cases that may require iteration.
