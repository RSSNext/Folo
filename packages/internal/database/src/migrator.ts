import { sql } from "drizzle-orm"
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"

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
  db: SqliteRemoteDatabase<TSchema>,
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
