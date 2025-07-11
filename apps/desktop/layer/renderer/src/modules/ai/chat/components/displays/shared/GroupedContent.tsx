import type { ReactNode } from "react"

export interface GroupedContentProps<T> {
  data: T[]
  groupBy: string
  groupKeyExtractor: (item: T) => string
  renderGroup: (groupData: T[], groupName: string) => ReactNode
  sortGroups?: (a: string, b: string) => number
  className?: string
}

export const GroupedContent = <T,>({
  data,
  groupBy,
  groupKeyExtractor,
  renderGroup,
  sortGroups,
  className,
}: GroupedContentProps<T>) => {
  if (!data?.length || groupBy === "none") {
    return null
  }

  const groups = data.reduce(
    (acc, item) => {
      const key = groupKeyExtractor(item)
      if (!acc[key]) acc[key] = []
      acc[key]?.push(item)
      return acc
    },
    {} as Record<string, T[]>,
  )

  const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
    if (sortGroups) {
      return sortGroups(a, b)
    }
    return a.localeCompare(b)
  })

  return (
    <div className={className}>
      <div className="space-y-6">
        {sortedEntries.map(([groupName, groupData]) => (
          <div key={groupName}>
            <h3 className="text-text mb-4 text-lg font-semibold">{groupName}</h3>
            {renderGroup(groupData, groupName)}
          </div>
        ))}
      </div>
    </div>
  )
}
