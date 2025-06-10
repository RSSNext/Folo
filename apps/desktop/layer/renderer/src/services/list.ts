import type { ListModel } from "@follow/models/types"

import { browserDB } from "~/database"

import { BaseService } from "./base"
import { CleanerService } from "./cleaner"
import type { Hydratable } from "./interface"

class ServiceStatic extends BaseService<{ id: string }> implements Hydratable {
  constructor() {
    super(browserDB.lists)
  }

  override async upsertMany(data: ListModel[]) {
    CleanerService.reset(data.map((d) => ({ type: "list", id: d.id! })))

    // FIXME The backend should not pass these computed attributes, and these need to be removed here.
    // Subsequent refactoring of the backend data flow should not nest computed attributes
    return this.table.bulkPut(data.map(({ owner, ...d }) => d) as ListModel[])
  }

  override async findAll() {
    return super.findAll() as unknown as ListModel[]
  }

  override async upsert({ owner, ...data }: ListModel): Promise<string | null> {
    if (!data.id) return null
    CleanerService.reset([{ type: "list", id: data.id }])
    return this.table.put(data as ListModel)
  }

  async bulkDelete(ids: string[]) {
    return this.table.bulkDelete(ids)
  }

  async findAndUpdate(id: string, data: Partial<ListModel>) {
    const list = await this.table.get(id)
    if (!list) return
    return this.table.put({ ...list, ...data })
  }

  async hydrate() {}
}

export const ListService = new ServiceStatic()
