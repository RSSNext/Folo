import type { DB } from "./types"

export declare const sqlite: unknown
export declare const db: DB
export declare function initializeDb(): void
export declare function migrateDb(): Promise<void>
