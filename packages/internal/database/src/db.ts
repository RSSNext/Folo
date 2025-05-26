import type { SQLiteDatabase } from "expo-sqlite"
import type { SQLocalDrizzle } from "sqlocal/drizzle"

import type { DB } from "./types"

export declare const sqlite: SQLiteDatabase | SQLocalDrizzle
export declare const db: DB
export declare function initializeDb(): void
export declare function migrateDb(): Promise<void>
