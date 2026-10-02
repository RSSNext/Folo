import { deleteAsync } from "expo-file-system"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

import { PlatformActivityIndicator } from "../components/ui/loading/PlatformActivityIndicator"
import { getDbPath } from "../database"
import { BugCuteReIcon } from "../icons/bug_cute_re"
import { useDatabaseMigration } from "../initialize/migration"
import { reloadApp } from "../lib/reload-app"

export const MigrationProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const { success, error } = useDatabaseMigration()
  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <BugCuteReIcon color="#ff0000" height={48} width={48} />
        <Text className="mt-5 text-text">{t("migration.error_title")}</Text>
        <View className="mt-2 rounded-md bg-system-background p-2">
          <Text className="font-mono text-text">{error.message}</Text>
        </View>

        <Button
          title={t("migration.reset_database")}
          onPress={async () => {
            const dbPath = getDbPath()
            await deleteAsync(dbPath)
            // Reload the app
            await reloadApp("Clear Sqlite Data")
          }}
        />
      </View>
    )
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <PlatformActivityIndicator />
        <Text className="mt-4 text-label">{t("migration.in_progress")}</Text>
      </View>
    )
  }
  return children
}
