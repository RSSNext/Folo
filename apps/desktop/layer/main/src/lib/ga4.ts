import { env } from "@follow/shared/env.desktop"
import { ofetch } from "ofetch"
import { v4 as uuidv4 } from "uuid"

import { logger } from "~/logger"

class Analytics4 {
  private trackingID: string
  private secretKey: string
  private clientID: string
  private sessionID: string
  private userID: string | null = null
  private userProperties: Record<string, { value: unknown }> | null = null

  private baseURL = "https://google-analytics.com/mp"
  private collectURL = "/collect"

  constructor(
    trackingID: string,
    secretKey: string,
    clientID: string = uuidv4(),
    sessionID = uuidv4(),
  ) {
    this.trackingID = trackingID
    this.secretKey = secretKey
    this.clientID = clientID
    this.sessionID = sessionID
  }

  setUserId(id: string) {
    this.userID = id

    return this
  }

  setUserProperties(upValue?: Record<string, unknown>) {
    const userProperties = Object.entries(upValue || {}).reduce((acc, [key, value]) => {
      acc[key] = {
        value,
      }
      return acc
    }, {})
    this.userProperties = userProperties

    return this
  }

  logEvent(eventName: string, params?: Record<string, unknown>, userAgent?: string): Promise<any> {
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

    return ofetch(
      `${this.baseURL}${this.collectURL}?measurement_id=${this.trackingID}&api_secret=${this.secretKey}`,
      {
        method: "POST",
        body: payload,
        headers: userAgent ? { "User-Agent": userAgent } : undefined,
      },
    )
  }
}

const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null

if (firebaseConfig?.measurementId && env.VITE_GA4_KEY) {
  logger.info(`GA4 is enabled with measurementId: ${firebaseConfig.measurementId}`)
}

export const ga4 =
  firebaseConfig?.measurementId && env.VITE_GA4_KEY
    ? new Analytics4(firebaseConfig?.measurementId, env.VITE_GA4_KEY)
    : null
