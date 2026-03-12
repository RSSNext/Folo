import { QueryClient } from '@tanstack/react-query'

const sharedClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 3,
      gcTime: 1000 * 3,
    },
  },
})
export const getQueryClient = () => sharedClient
