import { describe, expect, it } from "vitest"

import { parseFormat, parseISODate, parseNonNegativeInt, parsePositiveInt, parseView } from "./args"

describe("args parsers", () => {
  it("parses named view values", () => {
    expect(parseView("articles")).toBe(0)
    expect(parseView("social")).toBe(1)
    expect(parseView("pictures")).toBe(2)
    expect(parseView("videos")).toBe(3)
    expect(parseView("audio")).toBe(4)
    expect(parseView("notifications")).toBe(5)
  })

  it("parses numeric view values", () => {
    expect(parseView("0")).toBe(0)
    expect(parseView("5")).toBe(5)
  })

  it("throws for invalid view values", () => {
    expect(() => parseView("foo")).toThrowError(/Invalid view/)
    expect(() => parseView("6")).toThrowError(/Invalid view/)
  })

  it("parses positive integers", () => {
    expect(parsePositiveInt("1")).toBe(1)
    expect(parsePositiveInt("99")).toBe(99)
  })

  it("throws for non-positive integers", () => {
    expect(() => parsePositiveInt("0")).toThrowError(/positive integer/)
    expect(() => parsePositiveInt("-1")).toThrowError(/positive integer/)
  })

  it("parses non-negative integers", () => {
    expect(parseNonNegativeInt("0")).toBe(0)
    expect(parseNonNegativeInt("3")).toBe(3)
  })

  it("throws for negative integers", () => {
    expect(() => parseNonNegativeInt("-1")).toThrowError(/non-negative integer/)
  })

  it("parses ISO datetime", () => {
    expect(parseISODate("2026-02-25T10:30:00Z")).toBe("2026-02-25T10:30:00.000Z")
  })

  it("throws for invalid datetime", () => {
    expect(() => parseISODate("not-a-date")).toThrowError(/Invalid datetime/)
  })

  it("parses output format", () => {
    expect(parseFormat("json")).toBe("json")
    expect(parseFormat("table")).toBe("table")
    expect(parseFormat("plain")).toBe("plain")
  })

  it("throws for invalid output format", () => {
    expect(() => parseFormat("yaml")).toThrowError(/Invalid format/)
  })
})
