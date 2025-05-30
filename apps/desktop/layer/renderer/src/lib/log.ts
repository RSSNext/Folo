import { log } from "@follow/logger"

export const appLog = (...args: any[]) => {
  if (ELECTRON) log(...args)
  console.info(
    `%c ${APP_NAME} %c`,
    "color: #fff; margin: 0; padding: 5px 0; background: #ff5c00; border-radius: 3px;",
    ...args.reduce((acc, cur) => {
      acc.push("", cur)
      return acc
    }, []),
  )
}
