import { describe, expect, it } from "vitest"

import { formatNumber } from "../utils"

describe("formatNumber", () => {
  describe("English (default)", () => {
    it("should format numbers with K suffix", () => {
      expect(formatNumber(1000)).toBe("1.0K")
      expect(formatNumber(1500)).toBe("1.5K")
      expect(formatNumber(3700)).toBe("3.7K")
      expect(formatNumber(10000)).toBe("10.0K")
    })

    it("should format numbers with M suffix", () => {
      expect(formatNumber(1000000)).toBe("1.0M")
      expect(formatNumber(1500000)).toBe("1.5M")
      expect(formatNumber(4600000)).toBe("4.6M")
      expect(formatNumber(10000000)).toBe("10.0M")
    })

    it("should format numbers with B suffix", () => {
      expect(formatNumber(1000000000)).toBe("1.0B")
      expect(formatNumber(1500000000)).toBe("1.5B")
      expect(formatNumber(10000000000)).toBe("10.0B")
    })

    it("should handle small numbers without suffix", () => {
      expect(formatNumber(0)).toBe("0")
      expect(formatNumber(100)).toBe("100")
      expect(formatNumber(999)).toBe("999")
    })

    it("should handle negative numbers", () => {
      expect(formatNumber(-1000)).toBe("-1.0K")
      expect(formatNumber(-1500000)).toBe("-1.5M")
      expect(formatNumber(-100)).toBe("-100")
    })
  })

  describe("Korean", () => {
    it("should format numbers with 만 suffix", () => {
      expect(formatNumber(10000, "ko")).toBe("1만")
      expect(formatNumber(15000, "ko")).toBe("1.5만")
      expect(formatNumber(37000, "ko")).toBe("3.7만")
      expect(formatNumber(100000, "ko")).toBe("10만")
      expect(formatNumber(210000, "ko")).toBe("21만")
      expect(formatNumber(3400000, "ko")).toBe("340만")
      expect(formatNumber(4600000, "ko")).toBe("460만")
    })

    it("should format numbers with 억 suffix", () => {
      expect(formatNumber(100000000, "ko")).toBe("1억")
      expect(formatNumber(150000000, "ko")).toBe("1.5억")
      expect(formatNumber(1000000000, "ko")).toBe("10억")
      expect(formatNumber(8710000000, "ko")).toBe("87.1억")
    })

    it("should format numbers with 조 suffix", () => {
      expect(formatNumber(1000000000000, "ko")).toBe("1조")
      expect(formatNumber(1500000000000, "ko")).toBe("1.5조")
      expect(formatNumber(10000000000000, "ko")).toBe("10조")
    })

    it("should format small numbers with commas", () => {
      expect(formatNumber(0, "ko")).toBe("0")
      expect(formatNumber(100, "ko")).toBe("100")
      expect(formatNumber(3700, "ko")).toBe("3,700")
      expect(formatNumber(9999, "ko")).toBe("9,999")
    })

    it("should handle negative numbers in Korean", () => {
      expect(formatNumber(-10000, "ko")).toBe("-1만")
      expect(formatNumber(-100000000, "ko")).toBe("-1억")
      expect(formatNumber(-3700, "ko")).toBe("-3,700")
    })

    it("should show clean integers without decimals", () => {
      expect(formatNumber(10000, "ko")).toBe("1만") // Not 1.0만
      expect(formatNumber(20000, "ko")).toBe("2만") // Not 2.0만
      expect(formatNumber(100000000, "ko")).toBe("1억") // Not 1.0억
      expect(formatNumber(200000000, "ko")).toBe("2억") // Not 2.0억
    })
  })

  describe("Other locales", () => {
    it("should use K/M/B for unknown locales", () => {
      expect(formatNumber(1000, "fr")).toBe("1.0K")
      expect(formatNumber(1000000, "de")).toBe("1.0M")
      expect(formatNumber(1000000000, "es")).toBe("1.0B")
    })
  })
})
