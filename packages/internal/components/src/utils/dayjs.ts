import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import duration from "dayjs/plugin/duration"
import localizedFormat from "dayjs/plugin/localizedFormat"
import relativeTime from "dayjs/plugin/relativeTime"
// Initialize dayjs
export const initializeDayjs = () => {
  dayjs.extend(duration)
  dayjs.extend(relativeTime)
  dayjs.extend(localizedFormat)
  dayjs.extend(customParseFormat)
}
