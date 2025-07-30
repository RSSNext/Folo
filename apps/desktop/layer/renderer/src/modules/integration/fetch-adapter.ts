import { IN_ELECTRON } from "@follow/shared/constants"
import type { FetchError } from "ofetch"
import { ofetch } from "ofetch"

import { getIntegrationSettings } from "~/atoms/settings/integration"
import { ipcServices } from "~/lib/client"

/**
 * HTTP request options for fetch adapters
 */
export interface FetchRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

/**
 * HTTP response from fetch adapters
 */
export interface FetchResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  data?: any
  text?: string
}

/**
 * Abstract base class for HTTP fetch adapters
 */
export abstract class BaseFetchAdapter {
  abstract fetch(url: string, options?: FetchRequestOptions): Promise<FetchResponse>
}

/**
 * Browser fetch adapter using native fetch or ofetch
 */
export class BrowserFetchAdapter extends BaseFetchAdapter {
  async fetch(url: string, options?: FetchRequestOptions): Promise<FetchResponse> {
    const finalOptions = options || { method: "GET" }
    try {
      const requestOptions: Parameters<typeof ofetch>[1] = {
        method: finalOptions.method,
        headers: finalOptions.headers || {},
        timeout: finalOptions.timeout || 30000,
      }

      // Add body for methods that support it
      if (finalOptions.body && ["POST", "PUT", "PATCH"].includes(finalOptions.method)) {
        requestOptions.body = finalOptions.body
      }

      const response = await ofetch.raw(url, requestOptions)

      // Convert Headers object to plain object
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers,
        data: response._data,
        text: typeof response._data === "string" ? response._data : JSON.stringify(response._data),
      }
    } catch (error) {
      const fetchError = error as FetchError
      throw new Error(`Browser fetch failed: ${fetchError.message || "Unknown error"}`)
    }
  }
}

/**
 * Electron fetch adapter using IPC services
 */
export class ElectronFetchAdapter extends BaseFetchAdapter {
  async fetch(url: string, options?: FetchRequestOptions): Promise<FetchResponse> {
    const finalOptions = options || { method: "GET" }
    try {
      // Check if IPC services are available
      if (!ipcServices?.integration?.customFetch) {
        throw new Error("Electron IPC services not available")
      }

      const response = await ipcServices.integration.customFetch({
        url,
        method: finalOptions.method,
        headers: finalOptions.headers || {},
        body: finalOptions.body,
        timeout: finalOptions.timeout || 30000,
      })

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText || "OK",
        headers: response.headers || {},
        data: response.data,
        text: response.text,
      }
    } catch (error) {
      throw new Error(`Electron fetch failed: ${(error as Error).message || "Unknown error"}`)
    }
  }
}

/**
 * Fetch adapter factory and configuration
 */
export class FetchAdapterManager {
  private static instance: FetchAdapterManager
  private adapter: BaseFetchAdapter
  private preferElectron: boolean

  private constructor() {
    // Initialize preference based on settings
    // Default to browser fetch if useBrowserFetch is true, electron otherwise
    if (IN_ELECTRON) {
      const settings = getIntegrationSettings()
      this.preferElectron = !settings.useBrowserFetch
    } else {
      this.preferElectron = false // Always use browser fetch in non-Electron environment
    }

    this.adapter = this.createAdapter()
  }

  static getInstance(): FetchAdapterManager {
    if (!FetchAdapterManager.instance) {
      FetchAdapterManager.instance = new FetchAdapterManager()
    }
    return FetchAdapterManager.instance
  }

  /**
   * @description Electron only
   */
  preferElectronFetch() {
    this.preferElectron = true
    this.adapter = this.createAdapter()
  }
  /**
   * @description Electron only
   */
  preferClientFetch() {
    this.preferElectron = false
    this.adapter = this.createAdapter()
  }

  /**
   * Create appropriate adapter based on environment and preferences
   */
  private createAdapter(): BaseFetchAdapter {
    // If in Electron environment and Electron is preferred and available
    if (IN_ELECTRON && this.preferElectron && ipcServices?.integration?.customFetch) {
      return new ElectronFetchAdapter()
    }

    // Fallback to browser adapter
    return new BrowserFetchAdapter()
  }

  /**
   * Execute HTTP request using the current adapter
   */
  async fetch(url: string, options?: FetchRequestOptions): Promise<FetchResponse> {
    return this.adapter.fetch(url, options)
  }
}

/**
 * Convenience function to get the fetch adapter manager instance
 */
export const getFetchAdapter = () => FetchAdapterManager.getInstance()
