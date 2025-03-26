import { getStorageNS } from "@follow/utils/ns"

import { appLog } from "~/lib/log"

import type { DefineMigrationOptions } from "./helper"
import { v1 } from "./v/v1"

const appVersionKey = getStorageNS("app_version")
const migrationVersionKey = getStorageNS("migration_version")

declare global {
  interface Window {
    __app_is_upgraded__: boolean
  }
}

const getMigrationVersions = () => {
  try {
    const versions = localStorage.getItem(migrationVersionKey) || "[]"
    return new Set(JSON.parse(versions))
  } catch {
    return new Set()
  }
}
const migrations: DefineMigrationOptions[] = [v1]
export const doMigration = async () => {
  const migrationVersions = getMigrationVersions()

  for (const migration of migrations) {
    if (migrationVersions.has(migration.version)) continue

    appLog(`Migrating ${migration.version}...`)
    await migration.migrate()
    migrationVersions.add(migration.version)
  }

  localStorage.setItem(migrationVersionKey, JSON.stringify(Array.from(migrationVersions)))

  // AppVersion logic
  const lastVersion = localStorage.getItem(appVersionKey) || APP_VERSION
  localStorage.setItem(appVersionKey, APP_VERSION)

  const lastVersionParts = lastVersion.split("-")
  const lastVersionMajorMinor = lastVersionParts[0]
  const currentVersionMajorMinor = APP_VERSION.split("-")[0]
  if (lastVersion === APP_VERSION) return
  if (lastVersionMajorMinor === currentVersionMajorMinor) return

  window.__app_is_upgraded__ = true
  appLog(`Upgrade from ${lastVersion} to ${APP_VERSION}`)
}
