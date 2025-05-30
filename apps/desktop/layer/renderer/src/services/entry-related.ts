import { browserDB } from "~/database"

export enum EntryRelatedKey {
  READ = "READ",
  /** @deprecated */
  FEED_ID = "FEED_ID",
  COLLECTION = "COLLECTION",
}

const taskQueue = new Map<EntryRelatedKey, Promise<any>>(
  [EntryRelatedKey.READ, EntryRelatedKey.FEED_ID, EntryRelatedKey.COLLECTION].map((key) => [
    key,
    Promise.resolve(),
  ]),
)

type IdToIdRecord = Record<string, string>
type IdToBooleanRecord = Record<string, boolean>
type IdToAnyObjectRecord = Record<string, Record<string, any>>
const entryRelatedModel = browserDB.entryRelated
class ServiceStatic {
  async findAll(type: EntryRelatedKey.FEED_ID): Promise<IdToIdRecord>
  async findAll(type: EntryRelatedKey.READ): Promise<IdToBooleanRecord>
  async findAll(type: EntryRelatedKey.COLLECTION): Promise<IdToAnyObjectRecord>

  async findAll(type: EntryRelatedKey): Promise<Record<string, any>> {
    const data = await entryRelatedModel.get(type)
    return data ? data.data : {}
  }

  /**
   *
   * @param data key is entryId, value is read status
   * @returns
   */
  async upsert(type: EntryRelatedKey.READ, data: IdToBooleanRecord): Promise<void>
  async upsert(type: EntryRelatedKey.FEED_ID, data: IdToIdRecord): Promise<void>
  async upsert(type: EntryRelatedKey.COLLECTION, data: IdToAnyObjectRecord): Promise<void>
  async upsert(type: any, data: Record<string, any>) {
    const getPreviousTask = taskQueue.get(type) || Promise.resolve()

    const task = getPreviousTask.finally(async () => {
      const oldData = await this.findAll(type)

      entryRelatedModel.put({
        data: { ...oldData, ...data },
        id: type,
      })
    })
    taskQueue.set(type, task)

    return task
  }

  async deleteItems(type: EntryRelatedKey, keys: string[]) {
    const oldData = await this.findAll(type as any)
    keys.forEach((key) => {
      delete oldData[key]
    })

    return entryRelatedModel.put({
      data: oldData,
      id: type,
    })
  }

  async clear() {
    return entryRelatedModel.clear()
  }
}

export const EntryRelatedService = new ServiceStatic()
