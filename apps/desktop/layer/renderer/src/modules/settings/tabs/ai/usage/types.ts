// Analytics Types
export interface DailyPattern {
  date: string
  totalTokens: number
  peakHour?: number | null
}

export interface OperationPattern {
  operationType: string
  percentage: number
  totalTokens: number
}

export interface ModelPattern {
  model: string
  avgEfficiency: number
  totalTokens: number
}

// Chart Data Types
export interface ChartDataPoint {
  label: string
  value: number
}

export interface BarListItem {
  label: string
  value: number
  right?: string
}

// Component Props Types
export interface TokenCount {
  value: string
  unit: string
}
