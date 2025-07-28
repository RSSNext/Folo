export interface OpenAIConfig {
  apiKey?: string
  model: string
  temperature: number
  maxTokens: number
  baseURL?: string
  customEndpoint?: string
}

export class OpenAIClient {
  private config: OpenAIConfig
  private apiKey: string
  private baseURL: string

  constructor(config: OpenAIConfig) {
    this.config = config
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || ""

    // Support custom endpoints
    if (config.customEndpoint) {
      this.baseURL = config.customEndpoint
    } else if (config.baseURL) {
      this.baseURL = config.baseURL
    } else {
      this.baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    }

    if (!this.apiKey) {
      console.warn("⚠️  No OpenAI API key provided. Using fallback analysis.")
    }

    if (config.customEndpoint) {
      console.info(`🔗 Using custom OpenAI endpoint: ${this.baseURL}`)
    }
  }

  async chat(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not provided")
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API")
      }

      return data.choices[0].message.content
    } catch (error) {
      console.error("OpenAI API call failed:", error)
      throw error
    }
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey)
  }
}

export default OpenAIClient
