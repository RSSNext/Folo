import * as FileSystem from "expo-file-system"

export const getDbPath = () => {
  return `${FileSystem.documentDirectory}SQLite/follow.db`
}
if (__DEV__) console.info("SQLite:", getDbPath())
