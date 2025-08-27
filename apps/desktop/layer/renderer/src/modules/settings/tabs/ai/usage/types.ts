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
