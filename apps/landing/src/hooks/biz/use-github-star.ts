'use client'
import { useQuery } from '@tanstack/react-query'

type GithubRepoStatsResponse = {
  repo?: {
    stars?: number
  }
}

export const useGithubStar = () =>
  useQuery({
    queryKey: ['github-star'],
    queryFn: async () => {
      try {
        const response = await fetch('https://ungh.cc/repos/RSSNext/Folo')

        if (!response.ok) {
          throw new Error(`Failed to fetch repo stats: ${response.status}`)
        }

        const data = (await response.json()) as GithubRepoStatsResponse
        return typeof data.repo?.stars === 'number' ? data.repo.stars : -1
      } catch (error) {
        console.error(error)
        return -1
      }
    },
    staleTime: 1000 * 60 * 10,
  })
