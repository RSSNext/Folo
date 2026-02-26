type OS = 'macOS' | 'Windows' | 'Linux'

export function detectPlatform(userAgent: string): OS | null {
  if (userAgent.includes('mac')) {
    return 'macOS'
  } else if (userAgent.includes('win')) {
    return 'Windows'
  } else if (userAgent.includes('linux')) {
    return 'Linux'
  }

  return null
}
