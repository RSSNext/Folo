import { use } from 'react'

import { ScrollElementContext } from './ctx'

/**
 * Get the scroll area element when in radix scroll area
 * @returns
 */
export const useScrollViewElement = () => use(ScrollElementContext)
