import type { ListModel } from "./store"

export type CreateListModel = Pick<ListModel, "title" | "description" | "image" | "view" | "fee">
