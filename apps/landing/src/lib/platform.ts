import type { OS } from '~/constants/download'

export function detectPlatform(userAgent: string): OS | null {
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'iOS'
  } else if (userAgent.includes('android')) {
    return 'Android'
  } else if (userAgent.includes('mac')) {
    return 'macOS'
  } else if (userAgent.includes('win')) {
    return 'Windows'
  } else if (userAgent.includes('linux')) {
    return 'Linux'
  }

  return null
}
