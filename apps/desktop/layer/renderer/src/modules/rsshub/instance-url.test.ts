import { describe, expect, test } from "vitest"

import { canSaveRSSHubInstanceBaseUrl, isRSSHubInstanceBaseUrl } from "./instance-url"

describe("isRSSHubInstanceBaseUrl", () => {
  test("takes a plain http(s) address, with a path or a port", () => {
    expect(isRSSHubInstanceBaseUrl("https://rsshub.example.com")).toBe(true)
    expect(isRSSHubInstanceBaseUrl("http://192.168.1.2:1200/rsshub/")).toBe(true)
  })

  test("refuses what the server refuses", () => {
    expect(isRSSHubInstanceBaseUrl("ftp://rsshub.example.com")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("https://user:pass@rsshub.example.com")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("https://user@rsshub.example.com")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("https://rsshub.example.com/?key=1")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("https://rsshub.example.com/?")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("https://rsshub.example.com/#")).toBe(false)
    expect(isRSSHubInstanceBaseUrl("rsshub.example.com")).toBe(false)
  })
})

describe("canSaveRSSHubInstanceBaseUrl", () => {
  test("keeps saving an instance stored before URLs were checked", () => {
    const stored = "https://rsshub.example.com/?key=1"

    expect(canSaveRSSHubInstanceBaseUrl(stored, stored)).toBe(true)
    expect(canSaveRSSHubInstanceBaseUrl("https://rsshub.example.com?key=1", stored)).toBe(true)
    expect(canSaveRSSHubInstanceBaseUrl("https://rsshub.example.com/?key=2", stored)).toBe(false)
    expect(canSaveRSSHubInstanceBaseUrl("https://rsshub.example.com/?key=1")).toBe(false)
  })
})
