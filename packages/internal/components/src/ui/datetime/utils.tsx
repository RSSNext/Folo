import dayjs from "dayjs"

export const getUpdateInterval = (date: string | Date, relativeBeforeDay?: number) => {
  if (!relativeBeforeDay) return null
  const diffInSeconds = Math.abs(dayjs(date).diff(new Date(), "second"))
  if (diffInSeconds <= 60) {
    return 1000 // Update every second
  }
  const diffInMinutes = Math.abs(dayjs(date).diff(new Date(), "minute"))
  if (diffInMinutes <= 60) {
    return 60000 // Update every minute
  }
  const diffInHours = Math.abs(dayjs(date).diff(new Date(), "hour"))
  if (diffInHours <= 24) {
    return 3600000 // Update every hour
  }
  const diffInDays = Math.abs(dayjs(date).diff(new Date(), "day"))
  if (diffInDays <= relativeBeforeDay) {
    return 86400000 // Update every day
  }
  return null // No need to update
}
