import type { DB } from "./types"

export declare const db: DB
export declare function initDb(): void
export declare function migrateDb(): Promise<void>
