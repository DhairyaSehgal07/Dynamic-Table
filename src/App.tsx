import * as React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { farmerTableData, type FarmerTableRecord } from '@/data/farmer-table-data'
import { SheetDemoButton } from '@/components/sheet-demo-button'

const columnHelper = createColumnHelper<FarmerTableRecord>()
const multiValueFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: string[],
) => {
  const cellValue = String(row.getValue(columnId))
  if (!Array.isArray(filterValue)) return true
  if (filterValue.length === 0) return false
  return filterValue.includes(cellValue)
}

// --- Enhanced Column Definitions with Sorting ---
const columns = [
  columnHelper.accessor('gatePassNumber', {
    header: 'Gate Pass',
    cell: (info) => <span className="font-medium text-slate-700">{info.getValue()}</span>,
    sortingFn: 'alphanumeric', // Sort strings alphabetically (handles mixed numbers well)
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: (info) => <span className="text-slate-500">{info.getValue()}</span>,
    sortingFn: 'datetime', // Optimized for date sorting
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('farmer', {
    header: 'Farmer',
    cell: (info) => info.getValue(),
    sortingFn: 'text', // Strict alphabetical sorting
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('variety', {
    header: 'Variety',
    cell: (info) => info.getValue(),
    sortingFn: 'text',
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('bags', {
    header: () => <div className="w-full text-right">Bags</div>,
    cell: (info) => <div className="text-right tabular-nums">{info.getValue()}</div>,
    sortingFn: 'basic', // Standard number comparison
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('netWeight', {
    header: () => <div className="w-full text-right">Net Wt. (kg)</div>,
    cell: (info) => <div className="text-right tabular-nums font-medium">{info.getValue()}</div>,
    sortingFn: 'basic',
    filterFn: multiValueFilterFn,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    sortingFn: 'text',
    filterFn: (row, columnId, filterValue: string[]) => {
      const statusValue = row.getValue(columnId) as string
      if (!Array.isArray(filterValue)) return true
      if (filterValue.length === 0) return false
      return filterValue.includes(statusValue)
    },
    cell: (info) => {
      const isGraded = info.getValue() === 'GRADED'
      return (
        <Badge
          variant={isGraded ? 'default' : 'secondary'}
          className={`${isGraded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'} rounded-sm px-2 py-0.5 text-xs font-semibold uppercase`}
        >
          {info.getValue().replace('_', ' ')}
        </Badge>
      )
    },
  }),
]

const defaultColumnOrder = [
  'gatePassNumber',
  'date',
  'farmer',
  'variety',
  'bags',
  'netWeight',
  'status',
]

export default function App() {
  const [data] = React.useState(() => [...farmerTableData])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = React.useState<string[]>(defaultColumnOrder)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4 font-sans">

      {/* Fake Toolbar */}
      <div className="flex items-center justify-between bg-white p-3 border rounded-t-lg border-b-0 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Inward Ledger</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search gate pass..." className="pl-8 h-9 text-sm rounded-md" />
          </div>
          <SheetDemoButton table={table} />
        </div>
      </div>

      {/* The Grid Container */}
      <div className="overflow-hidden rounded-b-lg border shadow-sm bg-white">
        <Table className="w-full text-sm">
          <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  // Determine alignment based on column ID to place the sort icon correctly
                  const isRightAligned = header.id === 'bags' || header.id === 'netWeight'

                  return (
                    <TableHead
                      key={header.id}
                      className="h-9 px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider border-r last:border-r-0 align-middle select-none hover:bg-slate-200/50 transition-colors"
                    >
                      {header.isPlaceholder ? null : (
                        // 3. Clickable header area for sorting
                        <div
                          className={`flex items-center group cursor-pointer ${isRightAligned ? 'justify-end' : 'justify-between'}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}

                          {/* Sorting Icon Logic */}
                          <span className={`${isRightAligned ? 'ml-2' : ''}`}>
                            {{
                              asc: <ArrowUp className="ml-1 h-3.5 w-3.5 text-slate-800" />,
                              desc: <ArrowDown className="ml-1 h-3.5 w-3.5 text-slate-800" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`border-b transition-colors hover:bg-blue-50/50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 py-2 border-r last:border-r-0 align-middle text-slate-700"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center text-slate-500">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <h1> Feature given by Lokesh bhai: </h1>
      <ol>
        <li>Column Sizing</li>
        <li>Grouping</li>
        <li>Virtualised Rows</li>
      </ol>

      {/* Fake Footer/Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500 px-1">
        <span>Showing {table.getRowModel().rows.length} of {data.length} entries</span>
      </div>

    </div>
  )
}