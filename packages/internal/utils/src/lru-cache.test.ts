import { describe, expect, it } from "vitest"

import { LRUCache } from "./lru-cache"

describe("LRUCache", () => {
  it("should create cache with given capacity", () => {
    const cache = new LRUCache<string, number>(2)
    expect(cache.size()).toBe(0)
  })

  it("should throw error for invalid capacity", () => {
    expect(() => new LRUCache<string, number>(0)).toThrow()
    expect(() => new LRUCache<string, number>(-1)).toThrow()
  })

  it("should handle basic get and put operations", () => {
    const cache = new LRUCache<string, number>(2)

    cache.put("a", 1)
    expect(cache.get("a")).toBe(1)

    cache.put("b", 2)
    expect(cache.get("b")).toBe(2)
    expect(cache.size()).toBe(2)
  })

  it("should remove least recently used item when capacity is exceeded", () => {
    const cache = new LRUCache<string, number>(2)

    cache.put("a", 1)
    cache.put("b", 2)
    cache.put("c", 3)

    expect(cache.get("a")).toBeUndefined()
    expect(cache.get("b")).toBe(2)
    expect(cache.get("c")).toBe(3)
  })

  it("should update access order on get", () => {
    const cache = new LRUCache<string, number>(2)

    cache.put("a", 1)
    cache.put("b", 2)
    cache.get("a")
    cache.put("c", 3)

    expect(cache.get("b")).toBeUndefined()
    expect(cache.get("a")).toBe(1)
    expect(cache.get("c")).toBe(3)
  })

  it("should clear cache", () => {
    const cache = new LRUCache<string, number>(2)

    cache.put("a", 1)
    cache.put("b", 2)
    cache.clear()

    expect(cache.size()).toBe(0)
    expect(cache.get("a")).toBeUndefined()
    expect(cache.get("b")).toBeUndefined()
  })
})
