/**
 * @copy from renderer/src/store/utils/helper.ts
 */
import { enableMapSet, isDraft, original, produce } from "immer"
import type { StateCreator, StoreApi, UseBoundStore } from "zustand"
import { shallow } from "zustand/shallow"
import type { UseBoundStoreWithEqualityFn } from "zustand/traditional"
import { createWithEqualityFn } from "zustand/traditional"

const storeMap = {} as Record<string, UseBoundStoreWithEqualityFn<any>>

enableMapSet()
declare const globalThis: any
export const createZustandStore =
  <S, T extends StateCreator<S, [], []> = StateCreator<S, [], []>>(name: string) =>
  (store: T) => {
    const newStore = createWithEqualityFn(store, shallow)

    storeMap[name] = newStore

    globalThis.store =
      globalThis.store ||
      new Proxy(
        {},
        {
          get(_, prop) {
            if (prop in storeMap) {
              return new Proxy(() => {}, {
                get() {
                  return storeMap[prop as string].getState()
                },
                apply(target, thisArg, argumentsList) {
                  return storeMap[prop as string].setState(
                    produce(storeMap[prop as string].getState(), ...argumentsList),
                  )
                },
              })
            }
            return
          },
        },
      )

    globalThis[`store_${name}`] = newStore

    return newStore
  }
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type FunctionProps<T> = Pick<T, FunctionKeys<T>>
export const getStoreActions = <T extends { getState: () => any }>(
  store: T,
): FunctionProps<ReturnType<T["getState"]>> => {
  const actions = {} as any
  const state = store.getState()
  for (const key in state) {
    if (typeof state[key] === "function") {
      actions[key] = state[key]
    }
  }

  return actions as any
}

export function createImmerSetter<T>(useStore: UseBoundStore<StoreApi<T>>) {
  return (updater: (state: T) => void) =>
    useStore.setState((state) =>
      produce(state, (draft) => {
        try {
          return updater(draft as T)
        } catch (error) {
          console.error(error)
          throw error
        }
      }),
    )
}

type MayBeDraft<T> = T
export const toRaw = <T>(draft: MayBeDraft<T>): T => {
  return isDraft(draft) ? original(draft)! : draft
}
type SyncOrAsync<T> = T | Promise<T>
type ExecutorFn<S, Ctx, Result = void> = (snapshot: S, ctx: Ctx) => SyncOrAsync<Result>
type PersisterFn<S, Ctx, Result = void> = (
  snapshot: S,
  ctx: Ctx,
  result?: Result,
) => SyncOrAsync<void>

class Transaction<S, Ctx, Result = void> {
  private _snapshot: S
  private _ctx: Ctx
  private _result?: Result
  private onRollback?: ExecutorFn<S, Ctx>
  private executorFn?: ExecutorFn<S, Ctx, Result>
  private optimisticExecutor?: ExecutorFn<S, Ctx>
  private onPersist?: PersisterFn<S, Ctx, Result>

  constructor(snapshot?: S, ctx?: Ctx) {
    this._snapshot = snapshot || ({} as S)
    this._ctx = ctx || ({} as Ctx)
  }

  rollback(fn: ExecutorFn<S, Ctx>): this {
    this.onRollback = fn
    return this
  }

  request(executor: ExecutorFn<S, Ctx, Result>): this {
    this.executorFn = executor
    return this
  }

  store(executor: ExecutorFn<S, Ctx>): this {
    this.optimisticExecutor = executor
    return this
  }

  persist(fn: PersisterFn<S, Ctx, Result>): this {
    this.onPersist = fn
    return this
  }

  async run(): Promise<void> {
    let isOptimisticFailed = false

    if (this.optimisticExecutor) {
      try {
        await Promise.resolve(this.optimisticExecutor(this._snapshot, this._ctx))
      } catch (error) {
        isOptimisticFailed = true
        console.error(error)
      }
    }

    if (this.executorFn) {
      try {
        this._result = await Promise.resolve(this.executorFn(this._snapshot, this._ctx))
      } catch (err) {
        if (this.onRollback && !isOptimisticFailed) {
          await Promise.resolve(this.onRollback(this._snapshot, this._ctx))
        }
        throw err
      }
    }

    if (this.onPersist) {
      await Promise.resolve(this.onPersist!(this._snapshot, this._ctx, this._result)).catch(
        (err) => {
          console.error(err)
          throw err
        },
      )
    }
  }
}

export const createTransaction = <S, Ctx, Result = void>(
  snapshot?: S,
  ctx?: Ctx,
): Transaction<S, Ctx, Result> => {
  return new Transaction(snapshot, ctx)
}

export const createSelectorHelper = <TState>() => {
  return function defineSelector<TSelected>(selector: (state: TState) => TSelected) {
    return selector
  }
}
