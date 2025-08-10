import type { FC } from "react"

export const SearchInput: FC<React.ComponentProps<"input">> = (props) => {
  return (
    <div className="-mx-1 flex items-center border-b py-1">
      <i className="i-mgc-search-2-cute-re text-text-secondary ml-3 mr-1.5 size-4" />
      <input
        type="text"
        {...props}
        className="placeholder:text-text-tertiary w-full bg-transparent py-1 pl-0 pr-4 text-xs"
      />
    </div>
  )
}
