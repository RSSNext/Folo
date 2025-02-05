import { cn, toScientificNotation } from "@follow/utils"
import { Text } from "react-native"

export const Balance = ({
  children,

  className,
  precision = 2,
}: {
  /** The token balance in wei. */
  children: bigint

  className?: string
  precision?: number
}) => {
  const n = BigInt(children || 0n)
  const formatted = format(n, { digits: precision, trailingZeros: true })

  return <Text className={cn("tabular-nums", className)}>{formatted}</Text>
}

function format(
  value: bigint,
  options:
    | number
    | {
        digits?: number
        compact?: boolean
        trailingZeros?: boolean
        locale?: string
        decimalsRounding?: "ROUND_HALF" | "ROUND_UP" | "ROUND_DOWN"
        signDisplay?: "auto" | "always" | "exceptZero" | "negative" | "never"
      } = {},
): string {
  // Normalize options
  const opts = typeof options === "number" ? { digits: options } : options
  const {
    digits,
    compact = false,
    trailingZeros = false,
    locale = "en-US",

    signDisplay = "auto",
  } = opts

  // Convert bigint to number for formatting
  const num = Number(value) / 1e18 // Assuming 18 decimals (wei to ether conversion)

  if (compact) {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: digits,
      minimumFractionDigits: trailingZeros ? digits : 0,
      signDisplay,
    }).format(num)
  }

  // For very large or small numbers, use scientific notation
  if (Math.abs(num) > 1e9 || (Math.abs(num) < 1e-9 && num !== 0)) {
    return toScientificNotation(num.toString(), 10)
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: trailingZeros ? digits : 0,
    signDisplay,
    useGrouping: true,
  }).format(num)
}
