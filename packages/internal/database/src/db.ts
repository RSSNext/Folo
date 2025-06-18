import type { DB } from "./types"

export declare const sqlite: unknown
export declare const db: DB
export declare function initializeDB(): void
export declare function migrateDB(): Promise<void>
export declare function exportDB(): Promise<Blob>
