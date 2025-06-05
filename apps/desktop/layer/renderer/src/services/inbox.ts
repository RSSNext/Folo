import type { InboxModel } from "@follow/models/types"

import { browserDB } from "~/database"

import { BaseService } from "./base"
import { CleanerService } from "./cleaner"
import type { Hydratable } from "./interface"

class ServiceStatic extends BaseService<{ id: string }> implements Hydratable {
  constructor() {
    super(browserDB.inboxes)
  }

  override async upsertMany(data: InboxModel[]) {
    CleanerService.reset(data.map((d) => ({ type: "inbox", id: d.id! })))

    return this.table.bulkPut(data)
  }

  override async findAll() {
    return super.findAll() as unknown as InboxModel[]
  }

  override async upsert(data: InboxModel): Promise<string | null> {
    if (!data.id) return null
    CleanerService.reset([{ type: "inbox", id: data.id }])
    return this.table.put(data)
  }

  async bulkDelete(ids: string[]) {
    return this.table.bulkDelete(ids)
  }

  async hydrate() {}
}

export const InboxService = new ServiceStatic()
