interface SparklineProps {
  data: number[]
  color?: string
  area?: boolean
}

export const Sparkline = ({ data, color = "#22c55e", area }: SparklineProps) => {
  const w = 800
  const h = 160
  const pad = 8
  const max = Math.max(1, ...data)
  const min = Math.min(0, ...data)
  const range = Math.max(1, max - min)
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const points = data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const path = `M ${points.join(" L ")}`
  const areaPath = `M ${points[0]} L ${points.slice(1).join(" L ")} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="size-full">
      {area ? (
        <>
          <defs>
            <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#spark-grad)" />
        </>
      ) : null}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}
