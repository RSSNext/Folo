import { deleteAsync } from "expo-file-system"
import type { ReactNode } from "react"
import { Button, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

import { PlatformActivityIndicator } from "../components/ui/loading/PlatformActivityIndicator"
import { getDbPath } from "../database"
import { BugCuteReIcon } from "../icons/bug_cute_re"
import { useDatabaseMigration } from "../initialize/migration"

export const MigrationProvider = ({ children }: { children: ReactNode }) => {
  const { success, error } = useDatabaseMigration()
  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <BugCuteReIcon color="#ff0000" height={48} width={48} />
        <Text className="text-text mt-5">Oops, something went wrong...</Text>
        <View className="bg-system-background mt-2 rounded-md p-2">
          <Text className="text-text font-mono">{error.message}</Text>
        </View>

        <Button
          title="Reset Database"
          onPress={async () => {
            const dbPath = getDbPath()
            await deleteAsync(dbPath)
            // Reload the app
            await expo.reloadAppAsync("Clear Sqlite Data")
          }}
        />
      </View>
    )
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <PlatformActivityIndicator />
        <Text className="text-label mt-4">Database Migrations...</Text>
      </View>
    )
  }
  return children
}
