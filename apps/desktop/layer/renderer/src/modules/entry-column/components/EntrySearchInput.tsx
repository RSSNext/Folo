import { Input } from "@internal/components/ui/input/Input";
import { useAtom } from "jotai";
import { Search, X } from "lucide-react"; // Placeholder: Replace with actual icons
import * as React from "react";
import { useEffect, useState, useRef } from "react"; // Import useEffect, useState, useRef

import { desktopTimelineSearchQueryAtom } from "@/renderer/atoms/search";

interface EntrySearchInputProps {
  currentViewName: string;
}

export const EntrySearchInput = ({
  currentViewName,
}: EntrySearchInputProps) => {
  const [globalQuery, setGlobalQuery] = useAtom(desktopTimelineSearchQueryAtom);
  const [localQuery, setLocalQuery] = useState(globalQuery); // Initialize localQuery with globalQuery
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to update localQuery when globalQuery changes (e.g., cleared by view change)
  useEffect(() => {
    setLocalQuery(globalQuery);
  }, [globalQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setLocalQuery(newQuery); // Update local input immediately

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setGlobalQuery(newQuery); // Update global atom after debounce
    }, 300); // 300ms debounce delay
  };

  const clearSearch = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setLocalQuery("");
    setGlobalQuery(""); // Clear global atom immediately
  };

  return (
    <div className="p-2">
      <Input
        type="search"
        placeholder={`Search in ${currentViewName}...`}
        value={localQuery} // Use localQuery for input value
        onChange={handleSearchChange}
        leadingIcon={
          <Search
            size={16}
            className="ml-2 text-gray-500 dark:text-gray-400"
          />
        }
        trailingIcon={
          query ? (
            <X
              size={16}
              className="mr-2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={clearSearch}
            />
          ) : undefined
        }
        className="h-8 w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-blue-600"
        inputClassName="pl-8 pr-8" // Adjust padding for icons
      />
    </div>
  );
};
