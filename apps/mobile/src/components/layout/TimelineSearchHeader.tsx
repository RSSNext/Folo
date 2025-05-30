import { Input } from "@internal/components/ui/input/Input"
import { useAtom } from "jotai" // Import useSetAtom
import * as React from "react"
import { useEffect, useRef, useState } from "react" // Import useEffect, useState, useRef
import { View } from "react-native"

import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { SearchLoupeCuteReIcon } from "@/src/icons/search_loupe_cute_re"

import { timelineSearchQueryAtom } from "../../atoms/search"

export const TimelineSearchHeader = ({ currentViewTitle }: { currentViewTitle: string }) => {
  const [globalQuery, setGlobalQuery] = useAtom(timelineSearchQueryAtom)
  const [localQuery, setLocalQuery] = useState(globalQuery) // Initialize localQuery with globalQuery
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Effect to update localQuery when globalQuery changes (e.g., cleared by view change)
  useEffect(() => {
    setLocalQuery(globalQuery)
  }, [globalQuery])

  const handleSearch = (text: string) => {
    setLocalQuery(text) // Update local input immediately

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setGlobalQuery(text) // Update global atom after debounce
    }, 300) // 300ms debounce delay
  }

  const clearSearch = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    setLocalQuery("")
    setGlobalQuery("") // Clear global atom immediately
  }

  return (
    <View className="flex-1 flex-row items-center px-2">
      <Input
        placeholder={`Search in ${currentViewTitle}...`}
        value={localQuery} // Use localQuery for input value
        onChangeText={handleSearch}
        leftIcon={
          <View className="pl-2">
            <SearchLoupeCuteReIcon size={20} className="text-neutral-500 dark:text-neutral-400" />
          </View>
        }
        rightIcon={
          query ? (
            <CloseCircleFillIcon
              size={20}
              className="pr-2 text-neutral-500 dark:text-neutral-400"
              onPress={clearSearch}
            />
          ) : undefined
        }
        className="h-9 flex-1 rounded-lg bg-neutral-200/60 px-3 text-base text-neutral-900 dark:bg-neutral-800/60 dark:text-white"
        inputClassName="text-sm" // Match desktop styling a bit more
        containerClassName="flex-1"
      />
    </View>
  )
}
