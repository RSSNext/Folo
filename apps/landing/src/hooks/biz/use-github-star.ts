'use client'
import { useQuery } from '@tanstack/react-query'

import { getGithubStar } from '~/actions/github-star'

export const useGithubStar = () =>
  useQuery({
    queryKey: ['github-star'],
    queryFn: () => getGithubStar(),
  })
