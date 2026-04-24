import * as React from 'react'
import {
  type ColumnResizeDirection,
  type ColumnResizeMode,
  type FilterFn,
  type GroupingState,
  type Header,
  type Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { farmerTableData, type FarmerTableRecord } from '@/data/farmer-table-data'
import { SheetDemoButton } from '@/components/sheet-demo-button'

const columnHelper = createColumnHelper<FarmerTableRecord>()
const isFirefoxBrowser =
  typeof window !== 'undefined' && window.navigator.userAgent.includes('Firefox')
const DEFAULT_COLUMN_SIZE = 180
const DEFAULT_COLUMN_MIN_SIZE = 120
const DEFAULT_COLUMN_MAX_SIZE = 360

const multiValueFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: string[] | string,
) => {
  const cellValue = String(row.getValue(columnId))
  if (typeof filterValue === 'string') {
    const normalized = filterValue.trim().toLowerCase()
    if (!normalized) return true
    return cellValue.toLowerCase().includes(normalized)
  }
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
    minSize: 90,
    maxSize: 180,
  }),
  columnHelper.accessor('netWeight', {
    header: () => <div className="w-full text-right">Net Wt. (kg)</div>,
    cell: (info) => <div className="text-right tabular-nums font-medium">{info.getValue()}</div>,
    sortingFn: 'basic',
    filterFn: multiValueFilterFn,
    minSize: 110,
    maxSize: 220,
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

type FilterLogic = 'and' | 'or'

const globalGatePassFilterFn: FilterFn<FarmerTableRecord> = (
  row,
  _columnId: string,
  filterValue: string,
) => {
  const normalized = filterValue.trim().toLowerCase()
  if (!normalized) return true
  return String(row.original.gatePassNumber).toLowerCase().includes(normalized)
}

export default function App() {
  const [data] = React.useState(() => [...farmerTableData])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = React.useState<string[]>(defaultColumnOrder)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [grouping, setGrouping] = React.useState<GroupingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [filterLogic, setFilterLogic] = React.useState<FilterLogic>('and')
  const [columnResizeMode, setColumnResizeMode] = React.useState<ColumnResizeMode>('onChange')
  const [columnResizeDirection, setColumnResizeDirection] =
    React.useState<ColumnResizeDirection>('ltr')
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)

  const tableState = React.useMemo(
    () => ({
      sorting,
      columnVisibility,
      columnOrder,
      columnFilters,
      grouping,
      globalFilter,
    }),
    [sorting, columnVisibility, columnOrder, columnFilters, grouping, globalFilter],
  )

  const table = useReactTable<FarmerTableRecord>({
    data,
    columns,
    defaultColumn: {
      size: DEFAULT_COLUMN_SIZE,
      minSize: DEFAULT_COLUMN_MIN_SIZE,
      maxSize: DEFAULT_COLUMN_MAX_SIZE,
    },
    state: tableState,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onGlobalFilterChange: setGlobalFilter,
    columnResizeMode,
    columnResizeDirection,
    globalFilterFn: globalGatePassFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => String(row.gatePassNumber),
  })
  React.useLayoutEffect(() => {
    const element = tableContainerRef.current
    if (!element) return

    const updateWidth = () => {
      setContainerWidth(element.clientWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  const visibleColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows

  const tableTotalSize = table.getTotalSize()
  const effectiveTableWidth = Math.max(tableTotalSize, containerWidth)

  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index]?.getSize() ?? 160,
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3,
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()
  const virtualPaddingLeft = virtualColumns[0]?.start ?? 0
  const virtualPaddingRight =
    columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
  const containerRightPadding = Math.max(0, effectiveTableWidth - tableTotalSize)

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 40,
    getScrollElement: () => tableContainerRef.current,
    measureElement: isFirefoxBrowser ? undefined : (element) => element?.getBoundingClientRect().height,
    overscan: 8,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  const renderHeaderCell = React.useCallback(
    (header: Header<FarmerTableRecord, unknown>) => {
      const isRightAligned = header.id === 'bags' || header.id === 'netWeight'
      return (
        <th
          key={header.id}
          style={{ display: 'flex', width: header.getSize(), position: 'relative' }}
          className="h-9 overflow-hidden px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider border-r last:border-r-0 align-middle select-none hover:bg-slate-200/50 transition-colors whitespace-nowrap"
        >
          {header.isPlaceholder ? null : (
            <div
              className={`flex w-full min-w-0 items-center group cursor-pointer ${isRightAligned ? 'justify-end' : 'justify-between'}`}
              onClick={header.column.getToggleSortingHandler()}
            >
              <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
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
          <div
            onDoubleClick={() => header.column.resetSize()}
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            onClick={(event) => event.stopPropagation()}
            className={`resizer ${table.options.columnResizeDirection} ${
              header.column.getIsResizing() ? 'isResizing' : ''
            }`}
            style={{
              transform:
                columnResizeMode === 'onEnd' && header.column.getIsResizing()
                  ? `translateX(${
                      (table.options.columnResizeDirection === 'rtl' ? -1 : 1) *
                      (table.getState().columnSizingInfo.deltaOffset ?? 0)
                    }px)`
                  : '',
            }}
          />
        </th>
      )
    },
    [columnResizeMode, table],
  )

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4 font-sans">

      {/* Fake Toolbar */}
      <div className="flex items-center justify-between bg-white p-3 border rounded-t-lg border-b-0 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Inward Ledger</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search gate pass..."
              className="pl-8 h-9 text-sm rounded-md"
            />
          </div>
          <SheetDemoButton
            table={table}
            defaultColumnOrder={defaultColumnOrder}
            filterLogic={filterLogic}
            setFilterLogic={setFilterLogic}
            columnResizeMode={columnResizeMode}
            setColumnResizeMode={setColumnResizeMode}
            columnResizeDirection={columnResizeDirection}
            setColumnResizeDirection={setColumnResizeDirection}
          />
        </div>
      </div>

      {/* The Grid Container */}
      <div
        ref={tableContainerRef}
        className="overflow-auto rounded-b-lg border shadow-sm bg-white"
        style={{ direction: table.options.columnResizeDirection, height: '560px', position: 'relative' }}
      >
        {rows.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-500">
            No records found.
          </div>
        ) : (
          <table style={{ display: 'grid', width: effectiveTableWidth }} className="text-sm">
            <thead
              className="bg-slate-50 border-b-2 border-slate-200"
              style={{ display: 'grid', position: 'sticky', top: 0, zIndex: 10 }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
                  {virtualPaddingLeft ? <th style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
                  {virtualColumns.map((virtualColumn) => {
                    const header = headerGroup.headers[virtualColumn.index] as
                      | Header<FarmerTableRecord, unknown>
                      | undefined
                    if (!header) return null
                    return renderHeaderCell(header)
                  })}
                  {virtualPaddingRight + containerRightPadding ? (
                    <th
                      style={{
                        display: 'flex',
                        width: virtualPaddingRight + containerRightPadding,
                      }}
                    />
                  ) : null}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                display: 'grid',
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<FarmerTableRecord>
                const visibleCells = row.getVisibleCells()
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    className="border-b transition-colors hover:bg-blue-50/50"
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                      backgroundColor: virtualRow.index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.3)',
                    }}
                  >
                    {virtualPaddingLeft ? <td style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
                    {virtualColumns.map((virtualColumn) => {
                      const cell = visibleCells[virtualColumn.index]
                      if (!cell) return null
                      const isGroupedCell = cell.getIsGrouped()
                      const isAggregatedCell = cell.getIsAggregated()
                      const isPlaceholderCell = cell.getIsPlaceholder()
                      return (
                        <td
                          key={cell.id}
                          style={{ display: 'flex', width: cell.column.getSize() }}
                          className={`min-w-0 overflow-hidden px-3 py-2 border-r last:border-r-0 align-middle text-slate-700 whitespace-nowrap ${
                            isGroupedCell
                              ? 'bg-emerald-50/70'
                              : isAggregatedCell
                                ? 'bg-amber-50/70'
                                : isPlaceholderCell
                                  ? 'bg-slate-50'
                                  : ''
                          }`}
                        >
                          {isGroupedCell ? (
                            <button
                              type="button"
                              onClick={row.getToggleExpandedHandler()}
                              className={`inline-flex items-center gap-1 text-left ${
                                row.getCanExpand() ? 'cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <span className="text-xs">{row.getIsExpanded() ? '▼' : '▶'}</span>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              <span className="text-xs text-slate-500">({row.subRows.length})</span>
                            </button>
                          ) : isAggregatedCell ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          ) : isPlaceholderCell ? null : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      )
                    })}
                    {virtualPaddingRight + containerRightPadding ? (
                      <td
                        style={{
                          display: 'flex',
                          width: virtualPaddingRight + containerRightPadding,
                        }}
                      />
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>



      {/* Fake Footer/Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500 px-1">
        <span>Showing {rows.length} of {data.length} entries</span>
        <span>Filters: Column-based</span>
      </div>

    </div>
  )
}