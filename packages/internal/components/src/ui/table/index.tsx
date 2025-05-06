import { cn } from "@follow/utils/utils"
import type { VariantProps } from "class-variance-authority"
import * as React from "react"

import { tableCellVariants, tableHeadVariants } from "./variants"

const Table = ({
  ref,
  className,
  containerClassName,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & { containerClassName?: string } & {
  ref?: React.Ref<HTMLTableElement | null>
}) => (
  <div className={cn("relative w-full", containerClassName)}>
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
)
Table.displayName = "Table"

const TableHeader = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement | null>
}) => <thead ref={ref} className={cn(className)} {...props} />
TableHeader.displayName = "TableHeader"

const TableBody = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement | null>
}) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
TableBody.displayName = "TableBody"

const TableFooter = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement | null>
}) => (
  <tfoot
    ref={ref}
    className={cn("bg-material-thin border-t font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
)
TableFooter.displayName = "TableFooter"

const TableRow = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & {
  ref?: React.Ref<HTMLTableRowElement | null>
}) => (
  <tr
    ref={ref}
    className={cn("data-[state=selected]:bg-material-medium transition-colors", className)}
    {...props}
  />
)
TableRow.displayName = "TableRow"

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {}

const TableHead = ({
  ref,
  className,
  size,
  ...props
}: TableHeadProps & { ref?: React.Ref<HTMLTableCellElement | null> }) => (
  <th
    ref={ref}
    className={cn(
      "text-text-secondary text-left align-middle font-medium [&:has([role=checkbox])]:pr-0",
      tableHeadVariants({ size, className }),
    )}
    {...props}
  />
)
TableHead.displayName = "TableHead"

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {}

const TableCell = ({
  ref,
  className,
  size,
  ...props
}: TableCellProps & { ref?: React.Ref<HTMLTableCellElement | null> }) => (
  <td
    ref={ref}
    className={cn(
      "align-middle [&:has([role=checkbox])]:pr-0",
      tableCellVariants({ size, className }),
    )}
    {...props}
  />
)
TableCell.displayName = "TableCell"

const TableCaption = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement> & {
  ref?: React.Ref<HTMLTableCaptionElement | null>
}) => <caption ref={ref} className={cn("text-text-secondary mt-4 text-sm", className)} {...props} />
TableCaption.displayName = "TableCaption"

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
