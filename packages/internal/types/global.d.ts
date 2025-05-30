declare global {
  export type Nullable<T> = T | null | undefined
  type IsLiteralString<T> = T extends string ? (string extends T ? never : T) : never

  type OmitStringType<T> = T extends any[] ? OmitStringType<T[number]> : IsLiteralString<T>
  type NonUndefined<T> = T extends undefined
    ? never
    : T extends object
      ? { [K in keyof T]: NonUndefined<T[K]> }
      : T

  type NilValue = null | undefined | false | ""
  type Prettify<T> = {
    [K in keyof T]: T[K]
  } & {}
}

export {}
