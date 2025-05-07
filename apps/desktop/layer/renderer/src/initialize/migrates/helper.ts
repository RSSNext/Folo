export interface DefineMigrationOptions {
  version: string
  migrate: () => void | Promise<void>
}
export const defineMigration = (options: DefineMigrationOptions) => {
  return options
}
