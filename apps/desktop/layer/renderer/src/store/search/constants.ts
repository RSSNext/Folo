const SearchTypeBase = {
  Feed: 1,
  Entry: 1 << 1,
  Subscription: 1 << 2,
}

export const SearchType = {
  ...SearchTypeBase,
  All: Object.values(SearchTypeBase).reduce((acc, cur) => acc | cur, 0),
}

export type SearchType = (typeof SearchType)[keyof typeof SearchType]
