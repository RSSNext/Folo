import { Input } from "@follow/components/ui/input/index.js"
import { useCorrectZIndex } from "@follow/components/ui/z-index/ctx.js"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react"
import Fuse from "fuse.js"
import { AnimatePresence, m } from "motion/react"
import { forwardRef, Fragment, useCallback, useEffect, useState } from "react"

export type Suggestion = {
  name: string
  value: string
}
export interface AutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: Suggestion[]
  renderSuggestion?: (suggestion: Suggestion) => any

  onSuggestionSelected: (suggestion: NoInfer<Suggestion> | null) => void

  // classnames

  searchKeys?: string[]
  maxHeight?: number
}

const defaultSearchKeys = ["name", "value"]
const defaultRenderSuggestion = (suggestion: any) => suggestion?.name
export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      suggestions,
      renderSuggestion = defaultRenderSuggestion,
      onSuggestionSelected,
      maxHeight,

      value,
      searchKeys = defaultSearchKeys,
      defaultValue,
      ...inputProps
    },
    forwardedRef,
  ) => {
    const [selectedOptions, setSelectedOptions] = useState<NoInfer<Suggestion> | null>(
      () => suggestions.find((suggestion) => suggestion.value === value) || null,
    )

    const [filterableSuggestions, setFilterableSuggestions] = useState(suggestions)

    const doFilter = useCallback(() => {
      const fuse = new Fuse(suggestions, {
        keys: searchKeys,
      })

      const trimInputValue = (value as string)?.trim()

      if (!trimInputValue) return setFilterableSuggestions(suggestions)

      const results = fuse.search(trimInputValue)

      setFilterableSuggestions(results.map((result) => result.item))
    }, [suggestions, value, searchKeys])
    useEffect(() => {
      doFilter()
    }, [doFilter])

    const zIndex = useCorrectZIndex(9)
    return (
      <Combobox
        immediate
        value={selectedOptions}
        onChange={(suggestion) => {
          setSelectedOptions(suggestion)
          onSuggestionSelected(suggestion)
        }}
      >
        {({ open }) => {
          return (
            <Fragment>
              <ComboboxInput
                ref={forwardedRef}
                as={Input}
                autoComplete="off"
                aria-label="Select Category"
                displayValue={renderSuggestion}
                value={value}
                {...inputProps}
              />
              <AnimatePresence>
                {open && filterableSuggestions.length > 0 && (
                  <ComboboxOptions
                    portal
                    static
                    as={m.div}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    anchor="bottom"
                    style={{ zIndex }}
                    onWheel={stopPropagation}
                    className={cn(
                      "pointer-events-auto max-h-48 grow",
                      "shadow-perfect border-border bg-material-medium text-text backdrop-blur-background overflow-auto rounded-md border",
                      "w-[var(--input-width)] empty:invisible",
                    )}
                  >
                    <div style={{ maxHeight }}>
                      {filterableSuggestions.map((suggestion) => (
                        <ComboboxOption
                          key={suggestion.value}
                          value={suggestion}
                          className={cn(
                            "data-[focus]:bg-theme-item-hover dark:data-[focus]:bg-neutral-800",
                            "px-4 py-1.5 text-sm",
                          )}
                        >
                          {suggestion.name}
                        </ComboboxOption>
                      ))}
                    </div>
                  </ComboboxOptions>
                )}
              </AnimatePresence>
            </Fragment>
          )
        }}
      </Combobox>
    )
  },
)

Autocomplete.displayName = "Autocomplete"
