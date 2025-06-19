/**
 * format seconds to "MM:SS" or "HH:MM:SS"
 * @param {number} totalSeconds - 3661
 * @returns {string}            - "01:01:01"
 */
export function formatDuration(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds <= 0) {
    return
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const mm = minutes.toString().padStart(2, "0")
  const ss = seconds.toString().padStart(2, "0")

  if (hours === 0) {
    return `${mm}:${ss}` // "MM:SS"
  }
  const hh = hours.toString().padStart(2, "0")
  return `${hh}:${mm}:${ss}` // "HH:MM:SS"
}
