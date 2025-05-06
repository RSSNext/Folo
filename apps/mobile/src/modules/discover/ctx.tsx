import type { PrimitiveAtom } from "jotai"
import { atom } from "jotai"
import type { Dispatch, SetStateAction } from "react"
import { createContext, use, useState } from "react"
import type { Animated } from "react-native"
import { useAnimatedValue } from "react-native"

import { SearchType } from "./constants"

interface SearchPageContextType {
  searchFocusedAtom: PrimitiveAtom<boolean>
  searchValueAtom: PrimitiveAtom<string>

  searchTypeAtom: PrimitiveAtom<SearchType>
}
export const SearchPageContext = createContext<SearchPageContextType>(null!)

const SearchBarHeightContext = createContext<number>(0)
const setSearchBarHeightContext = createContext<Dispatch<SetStateAction<number>>>(() => {})
export const SearchBarHeightProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchBarHeight, setSearchBarHeight] = useState(0)
  return (
    <SearchBarHeightContext value={searchBarHeight}>
      <setSearchBarHeightContext.Provider value={setSearchBarHeight}>
        {children}
      </setSearchBarHeightContext.Provider>
    </SearchBarHeightContext>
  )
}

export const useSearchBarHeight = () => {
  return use(SearchBarHeightContext)
}
export const useSetSearchBarHeight = () => {
  return use(setSearchBarHeightContext)
}

export const SearchPageProvider = ({ children }: { children: React.ReactNode }) => {
  const [atomRefs] = useState((): SearchPageContextType => {
    const searchFocusedAtom = atom(false)
    const searchValueAtom = atom("")
    const searchTypeAtom = atom(SearchType.Feed)
    return {
      searchFocusedAtom,
      searchValueAtom,
      searchTypeAtom,
    }
  })
  return <SearchPageContext value={atomRefs}>{children}</SearchPageContext>
}

const SearchPageScrollContainerAnimatedXContext = createContext<Animated.Value>(null!)
export const SearchPageScrollContainerAnimatedXProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const scrollContainerAnimatedX = useAnimatedValue(0)
  return (
    <SearchPageScrollContainerAnimatedXContext value={scrollContainerAnimatedX}>
      {children}
    </SearchPageScrollContainerAnimatedXContext>
  )
}

export const useSearchPageScrollContainerAnimatedX = () => {
  return use(SearchPageScrollContainerAnimatedXContext)
}
export const useSearchPageContext = () => {
  const ctx = use(SearchPageContext)
  if (!ctx) throw new Error("useDiscoverPageContext must be used within a DiscoverPageProvider")
  return ctx
}
