'use client'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createStore, del, get, set } from 'idb-keyval'
import type { PropsWithChildren } from 'react'

import { isServerSide } from '~/lib/env'

const dbStore = isServerSide ? undefined : createStore('react-query', 'queries')

const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      const value = await get(key, dbStore)
      return value
    },
    setItem: async (key, value) => {
      await set(key, value, dbStore)
    },
    removeItem: async (key) => {
      await del(key, dbStore)
    },
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
    },
  },
})

const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const queryIsReadyForPersistance = query.state.status === 'success'

      if (query.meta?.persist === false) return false

      if (queryIsReadyForPersistance) {
        return (
          !((query.state?.data as any)?.pages?.length > 1) ||
          (!!query.state.data && !(query.state.data as any).pages)
        )
      } else {
        return false
      }
    },
  },
}
export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
