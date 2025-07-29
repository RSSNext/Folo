interface ApiConfig {
  baseUrl: string
  defaultHeaders?: Record<string, string | Promise<string | null>>
  maxRetries?: number
  initialRetryDelay?: number
}

interface FetchOptions extends RequestInit {
  retries?: number
}

export class Api {
  private baseUrl: string
  private headers: Record<string, string | Promise<string | null>>
  private maxRetries: number
  private initialRetryDelay: number

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl
    this.headers = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    }
    this.maxRetries = config.maxRetries ?? 3
    this.initialRetryDelay = config.initialRetryDelay ?? 500
  }

  setHeaders(headers: Record<string, string>) {
    this.headers = {
      ...this.headers,
      ...headers,
    }
  }

  private async resolveHeaders(): Promise<Record<string, string>> {
    const resolvedHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(this.headers)) {
      const resolvedValue = await value
      if (resolvedValue !== null) {
        resolvedHeaders[key] = resolvedValue
      }
    }
    return resolvedHeaders
  }

  private async post<ReqBody, ResBody>(
    url: string,
    data: ReqBody,
    options: FetchOptions,
    attempt: number,
  ): Promise<ResBody | null> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: await this.resolveHeaders(),
        body: JSON.stringify(data ?? {}),
        keepalive: true,
        ...options,
      })

      if (response.status === 401) return null

      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseText = await response.text()
      return responseText ? JSON.parse(responseText) : null
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.initialRetryDelay * 2 ** attempt
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.post<ReqBody, ResBody>(url, data, options, attempt + 1)
      }
      console.error("Max retries reached:", error)
      return null
    }
  }

  async fetch<ReqBody, ResBody>(
    path: string,
    data: ReqBody,
    options: FetchOptions = {},
  ): Promise<ResBody | null> {
    const url = `${this.baseUrl}${path}`
    return this.post<ReqBody, ResBody>(url, data, options, 0)
  }
}
