import { session } from "electron"
import type { Mock } from "vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { logger } from "../logger"
import { getProxyConfig, setProxyConfig, updateProxy } from "./proxy"
import { store } from "./store"

vi.mock("electron", () => ({
  session: {
    defaultSession: {
      setProxy: vi.fn(),
    },
  },
}))

vi.mock("./store", () => ({
  store: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("../logger", () => ({
  logger: {
    log: vi.fn(),
  },
}))

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("setProxyConfig", () => {
    it("should set proxy config and return true for valid proxy", () => {
      const proxy = "http://localhost:8080"
      const result = setProxyConfig(proxy)
      expect(store.set).toHaveBeenCalledWith("proxy", "http://localhost:8080")
      expect(result).toBe(true)
    })

    it("should set sock proxy config", () => {
      const proxy = "socks://localhost:8080"
      const result = setProxyConfig(proxy)
      expect(store.set).toHaveBeenCalledWith("proxy", "socks://localhost:8080")
      expect(result).toBe(true)
    })

    it("should handle default port", () => {
      // https://github.com/RSSNext/Follow/issues/1197
      const proxy = "http://example.com:80"
      const result = setProxyConfig(proxy)
      expect(store.set).toHaveBeenCalledWith("proxy", "http://example.com")
      expect(result).toBe(true)
    })

    it("should return false for invalid proxy", () => {
      const proxy = "invalid-proxy"
      const result = setProxyConfig(proxy)
      expect(store.delete).toHaveBeenCalledWith("proxy")
      expect(result).toBe(false)
    })
  })

  describe("getProxyConfig", () => {
    it("should return normalized proxy config if set", () => {
      ;(store.get as Mock).mockReturnValue("http://localhost:8080")
      const result = getProxyConfig()
      expect(result).toBe("http://localhost:8080")
    })

    it("should compatible dirty data", () => {
      ;(store.get as Mock).mockReturnValue("http://localhost:8080,direct://")
      const result = getProxyConfig()
      expect(result).toBe("http://localhost:8080")
    })
  })

  describe("updateProxy", () => {
    it("should set system proxy mode if no proxy config is set", () => {
      ;(store.get as Mock).mockReturnValue("")
      updateProxy()
      expect(session.defaultSession.setProxy).toHaveBeenCalledWith({ mode: "system" })
    })

    it("should set proxy rules if proxy config is set", () => {
      ;(store.get as Mock).mockReturnValue("http://localhost:8080")
      updateProxy()
      expect(logger.log).toHaveBeenCalledWith("Loading proxy: http://localhost:8080,direct://")
      expect(session.defaultSession.setProxy).toHaveBeenCalledWith({
        proxyRules: "http://localhost:8080,direct://",
        proxyBypassRules: "<local>",
      })
    })
  })
})
