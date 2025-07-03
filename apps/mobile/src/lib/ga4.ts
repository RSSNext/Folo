import { apiClient } from "./api-fetch"
import { getClientId, getSessionId } from "./client-session"

class Analytics4 {
  private clientID: string
  private sessionID: string
  private userID: string | null = null
  private userProperties: Record<string, { value: unknown }> | null = null

  constructor(clientID: string = getClientId(), sessionID = getSessionId()) {
    this.clientID = clientID
    this.sessionID = sessionID
  }

  async setUserId(id: string) {
    this.userID = id
  }

  async setUserProperties(upValue?: Record<string, unknown>) {
    const userProperties = Object.entries(upValue || {}).reduce(
      (acc, [key, value]) => {
        acc[key as string] = {
          value,
        }
        return acc
      },
      {} as Record<string, { value: unknown }>,
    )
    this.userProperties = userProperties
  }

  async logEvent(eventName: string, params?: Record<string, unknown>): Promise<any> {
    delete params?.__code
    delete params?.__eventName

    const payload = {
      client_id: this.clientID,
      user_id: this.userID,
      events: [
        {
          name: eventName,
          params: {
            session_id: this.sessionID,
            engagement_time_msec: 1000,
            ...params,
          },
        },
      ],
      user_properties: this.userProperties,
    }

    return apiClient.data.g.$post({
      json: payload,
    })
  }
}

export const ga4 = new Analytics4()
