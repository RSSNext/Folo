import { describe, expect, test } from "vitest"

import { doesTextContainHTML, isBizId, omitShallow, toScientificNotation } from "./utils"

describe("utils", () => {
  test("isBizId", () => {
    expect(isBizId("1712546615000")).toBe(true)
    expect(isBizId("17125466150000")).toBe(true)
    expect(isBizId("171254661500000")).toBe(true)
    expect(isBizId("1712546615000000")).toBe(true)
    expect(isBizId("17125466150000000")).toBe(true)
    expect(isBizId("171254661500000000")).toBe(true)
    expect(isBizId("1712546615000000000")).toBe(true)
    expect(isBizId("9994780527253199722")).toBe(false)

    // sample biz id
    expect(isBizId("41147805272531997")).toBe(true)

    // test string
    expect(isBizId("ep 1712546615000")).toBe(false)
    expect(isBizId("又有人在微博提到 DIYgod 了")).toBe(false)

    // test short number
    expect(isBizId("123456789")).toBe(false)

    // test long number
    expect(isBizId("12345678901234567890")).toBe(false)
  })

  test("toScientificNotation", () => {
    // Test numbers below threshold (should return original number)
    expect(toScientificNotation(123n, 3)).toBe("123.00")
    expect(toScientificNotation(999n, 3)).toBe("999.00")
    expect(toScientificNotation(1234n, 5)).toBe("1,234.00")

    // Test numbers above threshold (should convert to scientific notation)
    expect(toScientificNotation(1234n, 3)).toBe("1.23e+3")
    expect(toScientificNotation(12345n, 3)).toBe("1.23e+4")
    expect(toScientificNotation(123456789n, 5)).toBe("1.23e+8")

    // Test with decimal numbers
    expect(toScientificNotation([123456n, 2], 3)).toBe("1.23e+3")

    // Test with leading zeros
    expect(toScientificNotation(1234n, 3)).toBe("1.23e+3")
    expect(toScientificNotation([1234n, 4], 3)).toBe("0.12")

    // Test with larger threshold
    expect(toScientificNotation(12345678n, 8)).toBe("12,345,678.00")
    expect(toScientificNotation(123456789n, 8)).toBe("1.23e+8")

    // Edge cases
    expect(toScientificNotation(0n, 3)).toBe("0")

    // Test with locales
    // English locale (should use 'e+' notation)
    expect(toScientificNotation(1234567n, 3, "en-US")).toBe("1.23e+6")
    expect(toScientificNotation(1234567n, 3, "en-GB")).toBe("1.23e+6")

    // Non-English locales (should use '×10^' notation)
    expect(toScientificNotation(1234567n, 3, "fr-FR")).toBe("1,23×10^6")
    expect(toScientificNotation(1234567n, 3, "de-DE")).toBe("1,23×10^6")

    // Test different number formatting per locale
    // Using comma as decimal separator
    expect(toScientificNotation(1234567n, 3, "fr-FR")).toBe("1,23×10^6")
    expect(toScientificNotation(1234567n, 3, "de-DE")).toBe("1,23×10^6")

    // Using period as decimal separator
    expect(toScientificNotation(1234567n, 3, "en-US")).toBe("1.23e+6")

    // Test with integer numbers below threshold with different locales
    expect(toScientificNotation(1234n, 5, "en-US")).toBe("1,234.00")
    expect(toScientificNotation(1234n, 5, "de-DE")).toBe("1.234,00")

    expect(toScientificNotation(1234n, 5, "fr-FR")).toBe("1 234,00")

    // Test with real cases
    expect(toScientificNotation([60386874408275410679920n, 18], 6)).toBe("60,386.87")
  })

  test("omitShallow", () => {
    expect(omitShallow({ a: 1, b: 2, c: 3 }, "a", "b")).toEqual({ c: 3 })
    expect(omitShallow(null)).toEqual(null)
    expect(omitShallow(void 0)).toEqual(void 0)
    expect(omitShallow([1, 2])).toEqual([1, 2])
  })

  test("does text contain html", () => {
    expect(doesTextContainHTML("a<div>b</div>")).toBe(true)
    expect(doesTextContainHTML("Test")).toBe(false)
    expect(doesTextContainHTML("<p> </p>")).toBe(false)
    expect(doesTextContainHTML("Test <p> </p>")).toBe(false)
    expect(doesTextContainHTML("Test <br/>")).toBe(false)
  })
})
