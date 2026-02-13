import { sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import type { SQLiteDatabase } from "expo-sqlite"

interface MigrationConfig {
  journal: MigrationJournal
  migrations: Record<string, string>
  migrationsTable?: string
}

interface MigrationJournal {
  version: string
  dialect: string
  entries: {
    idx: number
    version: string
    when: number
    tag: string
    breakpoints: boolean
  }[]
}

interface MigrationMeta {
  sql: string[]
  folderMillis: number
  hash: string
  bps: boolean
}

type MaybePromise<T> = T | Promise<T>
type SQLiteMigrationDatabase = Pick<SQLiteDatabase, "execSync" | "getAllSync">

interface SQLiteColumnInfo {
  name: string
}

interface SQLiteMigrationRow {
  id: number
  hash: string
  created_at: number | string
}

const ADD_COLUMN_RE = /^ALTER TABLE\s+[`"]?([A-Za-z0-9_]+)[`"]?\s+ADD\s+[`"]?([A-Za-z0-9_]+)[`"]?\s+/i
const DROP_COLUMN_RE =
  /^ALTER TABLE\s+[`"]?([A-Za-z0-9_]+)[`"]?\s+DROP COLUMN\s+[`"]?([A-Za-z0-9_]+)[`"]?\s*;?$/i

// https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/expo-sqlite/migrator.ts
async function readMigrationFiles({
  journal,
  migrations,
}: MigrationConfig): Promise<MigrationMeta[]> {
  const migrationQueries: MigrationMeta[] = []

  for await (const journalEntry of journal.entries) {
    const query = migrations[`m${journalEntry.idx.toString().padStart(4, "0")}`]

    if (!query) {
      throw new Error(`Missing migration: ${journalEntry.tag}`)
    }

    try {
      const result = query.split("--> statement-breakpoint").map((it) => {
        return it
      })

      migrationQueries.push({
        sql: result,
        bps: journalEntry.breakpoints,
        folderMillis: journalEntry.when,
        hash: "",
      })
    } catch {
      throw new Error(`Failed to parse migration: ${journalEntry.tag}`)
    }
  }

  return migrationQueries
}

// https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/sqlite-proxy/migrator.ts
export async function migrate<TSchema extends Record<string, unknown>>(
  db: {
    run(query: SQL): MaybePromise<unknown>
    values<TResult extends unknown[]>(query: SQL): MaybePromise<TResult[]>
  },
  config: MigrationConfig,
) {
  const migrations = await readMigrationFiles(config)

  const migrationTableCreate = sql`
		CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		)
	`

  await db.run(migrationTableCreate)

  const dbMigrations = await db.values<[number, string, string]>(
    sql`SELECT id, hash, created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1`,
  )

  const lastDbMigration = dbMigrations[0] ?? undefined

  const queriesToRun: string[] = []
  for (const migration of migrations) {
    if (!lastDbMigration || Number(lastDbMigration[2])! < migration.folderMillis) {
      queriesToRun.push(
        ...migration.sql,
        `INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES('${migration.hash}', '${migration.folderMillis}')`,
      )
    }
  }

  for (const query of queriesToRun) {
    await db.run(sql.raw(query))
  }
}

function getTableColumns(db: SQLiteMigrationDatabase, tableName: string): Set<string> {
  const escapedTableName = tableName.replaceAll("`", "``")
  const columns = db.getAllSync<SQLiteColumnInfo>(`PRAGMA table_info(\`${escapedTableName}\`)`)
  return new Set(columns.map((column) => column.name))
}

function shouldSkipMigrationQuery(db: SQLiteMigrationDatabase, query: string): boolean {
  const addColumnMatch = query.match(ADD_COLUMN_RE)
  if (addColumnMatch) {
    const tableName = addColumnMatch[1]
    const columnName = addColumnMatch[2]
    if (!tableName || !columnName) {
      return false
    }
    const columns = getTableColumns(db, tableName)
    return columns.has(columnName)
  }

  const dropColumnMatch = query.match(DROP_COLUMN_RE)
  if (dropColumnMatch) {
    const tableName = dropColumnMatch[1]
    const columnName = dropColumnMatch[2]
    if (!tableName || !columnName) {
      return false
    }
    const columns = getTableColumns(db, tableName)
    return !columns.has(columnName)
  }

  return false
}

export async function migrateExpoSQLite(db: SQLiteMigrationDatabase, config: MigrationConfig) {
  const migrations = await readMigrationFiles(config)

  db.execSync(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    );
  `)

  const dbMigrations = db.getAllSync<SQLiteMigrationRow>(
    `SELECT id, hash, created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1`,
  )
  const lastDbMigration = dbMigrations[0] ?? undefined

  for (const migration of migrations) {
    if (lastDbMigration && Number(lastDbMigration.created_at) >= migration.folderMillis) {
      continue
    }

    for (const rawQuery of migration.sql) {
      const query = rawQuery.trim()
      if (!query) {
        continue
      }
      if (shouldSkipMigrationQuery(db, query)) {
        continue
      }
      db.execSync(query)
    }

    const escapedHash = migration.hash.replaceAll("'", "''")
    db.execSync(
      `INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES('${escapedHash}', '${migration.folderMillis}')`,
    )
  }
}
