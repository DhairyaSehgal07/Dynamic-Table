import * as React from 'react'
import type {
  ColumnResizeDirection,
  ColumnResizeMode,
  Table as TanstackTable,
} from '@tanstack/react-table'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  SlidersHorizontal,
  Columns3,
  Rows3,
  Calendar as CalendarIcon,
  GripVertical,
  Search,
  ChevronDown,
} from 'lucide-react'
import type { FarmerTableRecord } from '@/data/farmer-table-data'

type SheetDemoButtonProps = {
  table: TanstackTable<FarmerTableRecord>
  defaultColumnOrder: string[]
  filterLogic: 'and' | 'or'
  setFilterLogic: React.Dispatch<React.SetStateAction<'and' | 'or'>>
  columnResizeMode: ColumnResizeMode
  setColumnResizeMode: React.Dispatch<React.SetStateAction<ColumnResizeMode>>
  columnResizeDirection: ColumnResizeDirection
  setColumnResizeDirection: React.Dispatch<React.SetStateAction<ColumnResizeDirection>>
}

type StatusFilterValue = 'GRADED' | 'NOT_GRADED'
type FilterableColumnId =
  | 'gatePassNumber'
  | 'date'
  | 'farmer'
  | 'variety'
  | 'bags'
  | 'netWeight'

const filterableColumns: Array<{ id: FilterableColumnId; label: string; searchable: boolean }> = [
  { id: 'gatePassNumber', label: 'Gate Pass Number', searchable: true },
  { id: 'date', label: 'Date', searchable: true },
  { id: 'farmer', label: 'Farmers', searchable: true },
  { id: 'variety', label: 'Crop Variety', searchable: true },
  { id: 'bags', label: 'Bags', searchable: true },
  { id: 'netWeight', label: 'Net Weight (kg)', searchable: true },
]

type SortableColumnRowProps = {
  columnId: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

type SortableGroupingRowProps = {
  columnId: string
  label: string
  groupedIndex: number
  onRemove: () => void
}

type GroupingDropZoneProps = {
  index: number
  isActive: boolean
}

function SortableColumnRow({
  columnId,
  label,
  checked,
  onCheckedChange,
}: SortableColumnRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: columnId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Reorder ${label}`}
          className="cursor-grab text-slate-300 group-hover:text-slate-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Label htmlFor={`col-${columnId}`} className="cursor-pointer text-sm font-medium text-slate-700">
          {label}
        </Label>
      </div>
      <Switch
        id={`col-${columnId}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  )
}

function SortableGroupingRow({
  columnId,
  label,
  groupedIndex,
  onRemove,
}: SortableGroupingRowProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `grouping-item:${columnId}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded border border-slate-200 bg-white p-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Reorder ${label}`}
          className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-blue-600">#{groupedIndex + 1}</span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <Button type="button" variant="ghost" className="h-7 px-2 text-xs" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
}

function GroupingDropZone({ index, isActive }: GroupingDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `grouping-slot:${index}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`h-2 rounded ${isActive ? 'bg-blue-300/80' : 'bg-transparent'}`}
      aria-hidden
    />
  )
}

export function SheetDemoButton({
  table,
  defaultColumnOrder,
  filterLogic,
  setFilterLogic,
  columnResizeMode,
  setColumnResizeMode,
  columnResizeDirection,
  setColumnResizeDirection,
}: SheetDemoButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQueries, setSearchQueries] = React.useState<Record<FilterableColumnId, string>>({
    gatePassNumber: '',
    date: '',
    farmer: '',
    variety: '',
    bags: '',
    netWeight: '',
  })
  const [expandedFilters, setExpandedFilters] = React.useState<Record<FilterableColumnId, boolean>>({
    gatePassNumber: false,
    date: false,
    farmer: false,
    variety: false,
    bags: false,
    netWeight: false,
  })
  const [draftColumnVisibility, setDraftColumnVisibility] = React.useState<Record<string, boolean>>({})
  const [draftColumnOrder, setDraftColumnOrder] = React.useState<string[]>([])
  const [draftStatusFilters, setDraftStatusFilters] = React.useState<StatusFilterValue[]>([
    'GRADED',
    'NOT_GRADED',
  ])
  const [draftValueFilters, setDraftValueFilters] = React.useState<Record<FilterableColumnId, string[]>>({
    gatePassNumber: [],
    date: [],
    farmer: [],
    variety: [],
    bags: [],
    netWeight: [],
  })
  const [draftGrouping, setDraftGrouping] = React.useState<string[]>([])
  const [draftFilterLogic, setDraftFilterLogic] = React.useState<'and' | 'or'>(filterLogic)
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  )
  const availableFilterOptions: Record<FilterableColumnId, string[]> = {
    gatePassNumber: [],
    date: [],
    farmer: [],
    variety: [],
    bags: [],
    netWeight: [],
  }

  filterableColumns.forEach(({ id }) => {
    const facetedValues = table.getColumn(id)?.getFacetedUniqueValues()
    if (facetedValues) {
      availableFilterOptions[id] = Array.from(facetedValues.keys())
        .map((value) => String(value))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    }
  })

  const hidableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
  const hidableColumnIds = hidableColumns.map((column) => column.id)
  const columnMap = new Map(hidableColumns.map((column) => [column.id, column]))
  const orderedColumns = draftColumnOrder
    .map((columnId) => columnMap.get(columnId))
    .filter((column) => column !== undefined)

  const syncDraftFromTable = () => {
    const nextDraft: Record<string, boolean> = {}
    hidableColumns.forEach((column) => {
      nextDraft[column.id] = column.getIsVisible()
    })
    const activeOrder = table.getState().columnOrder
    const baseOrder = activeOrder.length > 0 ? activeOrder : defaultColumnOrder
    const validOrder = baseOrder.filter((id) => hidableColumnIds.includes(id))
    const missing = hidableColumnIds.filter((id) => !validOrder.includes(id))

    setDraftColumnVisibility(nextDraft)
    setDraftColumnOrder([...validOrder, ...missing])

    const rawStatusFilter = table.getColumn('status')?.getFilterValue()
    if (Array.isArray(rawStatusFilter)) {
      setDraftStatusFilters(rawStatusFilter as StatusFilterValue[])
    } else {
      setDraftStatusFilters(['GRADED', 'NOT_GRADED'])
    }

    const nextValueFilters: Record<FilterableColumnId, string[]> = {
      gatePassNumber: [],
      date: [],
      farmer: [],
      variety: [],
      bags: [],
      netWeight: [],
    }
    filterableColumns.forEach(({ id }) => {
      const rawFilter = table.getColumn(id)?.getFilterValue()
      if (Array.isArray(rawFilter)) {
        nextValueFilters[id] = rawFilter.map((value) => String(value))
      } else {
        nextValueFilters[id] = [...availableFilterOptions[id]]
      }
    })
    setDraftValueFilters(nextValueFilters)
    setDraftGrouping(table.getState().grouping)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (nextOpen) {
      syncDraftFromTable()
      setDraftFilterLogic(filterLogic)
      setSearchQueries({
        gatePassNumber: '',
        date: '',
        farmer: '',
        variety: '',
        bags: '',
        netWeight: '',
      })
      setExpandedFilters({
        gatePassNumber: false,
        date: false,
        farmer: false,
        variety: false,
        bags: false,
        netWeight: false,
      })
    }
  }

  const handleDraftVisibilityChange = (columnId: string, checked: boolean) => {
    setDraftColumnVisibility((current) => ({
      ...current,
      [columnId]: checked,
    }))
  }

  const handleShowAll = () => {
    setDraftColumnVisibility((current) => {
      const next = { ...current }
      hidableColumns.forEach((column) => {
        next[column.id] = true
      })
      return next
    })
  }

  const handleClearAll = () => {
    const resetVisibility: Record<string, boolean> = {}
    hidableColumns.forEach((column) => {
      resetVisibility[column.id] = true
    })

    const resetOrderBase = defaultColumnOrder.length > 0 ? defaultColumnOrder : hidableColumnIds
    const resetOrder = [
      ...resetOrderBase.filter((id) => hidableColumnIds.includes(id)),
      ...hidableColumnIds.filter((id) => !resetOrderBase.includes(id)),
    ]

    const resetValueFilters: Record<FilterableColumnId, string[]> = {
      gatePassNumber: [...availableFilterOptions.gatePassNumber],
      date: [...availableFilterOptions.date],
      farmer: [...availableFilterOptions.farmer],
      variety: [...availableFilterOptions.variety],
      bags: [...availableFilterOptions.bags],
      netWeight: [...availableFilterOptions.netWeight],
    }

    setDraftColumnVisibility(resetVisibility)
    setDraftColumnOrder(resetOrder)
    setDraftStatusFilters(['GRADED', 'NOT_GRADED'])
    setDraftValueFilters(resetValueFilters)
    setDraftGrouping([])
    setDraftFilterLogic('and')
    setSearchQueries({
      gatePassNumber: '',
      date: '',
      farmer: '',
      variety: '',
      bags: '',
      netWeight: '',
    })
    setExpandedFilters({
      gatePassNumber: false,
      date: false,
      farmer: false,
      variety: false,
      bags: false,
      netWeight: false,
    })

    table.setColumnVisibility({})
    table.setColumnOrder(resetOrder)
    table.resetColumnFilters()
    table.setGrouping([])
    setFilterLogic('and')
    setColumnResizeMode('onChange')
    setColumnResizeDirection('ltr')
  }

  const handleApplyView = () => {
    table.setColumnVisibility(draftColumnVisibility)
    table.setColumnOrder(draftColumnOrder)
    const statusColumn = table.getColumn('status')
    if (draftStatusFilters.length === 2) {
      statusColumn?.setFilterValue(undefined)
    } else {
      statusColumn?.setFilterValue(draftStatusFilters)
    }
    filterableColumns.forEach(({ id }) => {
      const column = table.getColumn(id)
      const selectedValues = draftValueFilters[id]
      const allValues = availableFilterOptions[id]
      if (selectedValues.length === allValues.length) {
        column?.setFilterValue(undefined)
      } else {
        column?.setFilterValue(selectedValues)
      }
    })
    table.setGrouping(draftGrouping)
    setFilterLogic(draftFilterLogic)
    setIsOpen(false)
  }

  const toggleStatusDraft = (status: StatusFilterValue, checked: boolean) => {
    setDraftStatusFilters((current) => {
      if (checked) {
        if (current.includes(status)) return current
        return [...current, status]
      }
      return current.filter((value) => value !== status)
    })
  }

  const toggleValueDraft = (columnId: FilterableColumnId, value: string, checked: boolean) => {
    setDraftValueFilters((current) => {
      const currentValues = current[columnId]
      if (checked) {
        if (currentValues.includes(value)) return current
        return {
          ...current,
          [columnId]: [...currentValues, value],
        }
      }
      return {
        ...current,
        [columnId]: currentValues.filter((currentValue) => currentValue !== value),
      }
    })
  }

  const handleToggleAllValues = (columnId: FilterableColumnId) => {
    const allValues = availableFilterOptions[columnId]
    const selectedValues = draftValueFilters[columnId]
    const areAllSelected = allValues.length > 0 && selectedValues.length === allValues.length
    setDraftValueFilters((current) => ({
      ...current,
      [columnId]: areAllSelected ? [] : [...allValues],
    }))
  }

  const toggleFilterSection = (columnId: FilterableColumnId) => {
    setExpandedFilters((current) => ({
      ...current,
      [columnId]: !current[columnId],
    }))
  }

  const setColumnSearchQuery = (columnId: FilterableColumnId, value: string) => {
    setSearchQueries((current) => ({
      ...current,
      [columnId]: value,
    }))
  }

  const getFilteredOptionsForColumn = (columnId: FilterableColumnId) => {
    const query = searchQueries[columnId].trim().toLowerCase()
    const allValues = availableFilterOptions[columnId]
    if (!query) return allValues
    return allValues.filter((option) => option.toLowerCase().includes(query))
  }

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setDraftColumnOrder((current) => {
      const oldIndex = current.indexOf(active.id as string)
      const newIndex = current.indexOf(over.id as string)
      if (oldIndex < 0 || newIndex < 0) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  const columnLabels: Record<string, string> = {
    gatePassNumber: 'Gate Pass Number',
    date: 'Date',
    farmer: 'Farmer Name',
    variety: 'Variety',
    bags: 'Bags',
    netWeight: 'Net Weight (kg)',
    status: 'Status',
  }

  const groupingOptions = table
    .getAllLeafColumns()
    .filter((column) => column.getCanGroup())
    .map((column) => ({
      id: column.id,
      label: columnLabels[column.id] ?? column.id,
      isGrouped: draftGrouping.includes(column.id),
    }))

  const toggleDraftGrouping = (columnId: string) => {
    setDraftGrouping((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId],
    )
  }

  const [activeGroupingDropIndex, setActiveGroupingDropIndex] = React.useState<number | null>(null)

  const parseGroupingColumnId = (id: string) => id.replace('grouping-item:', '')
  const parseGroupingSlotIndex = (id: string) => Number(id.replace('grouping-slot:', ''))

  const handleGroupingDragMove = (event: { over: { id: string | number } | null }) => {
    if (!event.over) {
      setActiveGroupingDropIndex(null)
      return
    }

    const overId = String(event.over.id)
    if (overId.startsWith('grouping-slot:')) {
      const index = parseGroupingSlotIndex(overId)
      if (!Number.isNaN(index)) {
        setActiveGroupingDropIndex(index)
        return
      }
    }

    if (overId.startsWith('grouping-item:')) {
      const columnId = parseGroupingColumnId(overId)
      const overIndex = draftGrouping.findIndex((id) => id === columnId)
      setActiveGroupingDropIndex(overIndex >= 0 ? overIndex : null)
      return
    }

    setActiveGroupingDropIndex(null)
  }

  const handleGroupingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveGroupingDropIndex(null)
    if (!over) return

    const activeId = String(active.id)
    if (!activeId.startsWith('grouping-item:')) return
    const activeColumnId = parseGroupingColumnId(activeId)

    let targetIndex: number | null = null
    const overId = String(over.id)
    if (overId.startsWith('grouping-slot:')) {
      const parsedIndex = parseGroupingSlotIndex(overId)
      if (!Number.isNaN(parsedIndex)) {
        targetIndex = parsedIndex
      }
    } else if (overId.startsWith('grouping-item:')) {
      const overColumnId = parseGroupingColumnId(overId)
      const overIndex = draftGrouping.findIndex((id) => id === overColumnId)
      if (overIndex >= 0) {
        targetIndex = overIndex
      }
    }

    if (targetIndex === null) return

    setDraftGrouping((current) => {
      const currentIndex = current.indexOf(activeColumnId)
      if (currentIndex < 0) return current

      const next = [...current]
      next.splice(currentIndex, 1)
      const clampedTargetIndex = Math.max(0, Math.min(targetIndex as number, next.length))
      next.splice(clampedTargetIndex, 0, activeColumnId)
      return next
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 text-slate-600 font-medium shadow-sm">
          <SlidersHorizontal className="h-4 w-4" />
          View & Filters
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            3
          </span>
        </Button>
      </SheetTrigger>

      {/* CRITICAL LAYOUT FIX: flex flex-col h-full ensures the footer stays at the bottom
        and only the middle content area scrolls.
      */}
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-[680px] p-0 gap-0 bg-slate-50/50 border-l"
      >
        {/* --- STICKY HEADER --- */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-slate-800">
              Customize View
            </SheetTitle>
            <SheetDescription className="text-slate-500 mt-1">
              Refine your ledger. Changes are applied when you save.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="filters" className="flex flex-col flex-1 overflow-hidden">

          {/* --- STICKY TABS LIST --- */}
          <div className="px-6 pt-3 pb-3 border-b border-slate-200 bg-white shadow-sm z-10">
            <TabsList className="grid w-full grid-cols-4 h-10 bg-slate-100/80 p-1">
              <TabsTrigger value="filters" className="gap-2 text-xs font-medium">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </TabsTrigger>
              <TabsTrigger value="columns" className="gap-2 text-xs font-medium">
                <Columns3 className="h-3.5 w-3.5" /> Columns
              </TabsTrigger>
              <TabsTrigger value="grouping" className="gap-2 text-xs font-medium">
                <Rows3 className="h-3.5 w-3.5" /> Grouping
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs font-medium">
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- SCROLLABLE CONTENT AREA --- */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

            {/* TAB 1: FILTERS */}
            <TabsContent value="filters" className="m-0 space-y-8 focus-visible:ring-0">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Match Logic
                </Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                  <Button
                    type="button"
                    variant={draftFilterLogic === 'and' ? 'default' : 'ghost'}
                    className="h-9 text-xs font-semibold uppercase tracking-wide"
                    onClick={() => setDraftFilterLogic('and')}
                  >
                    AND
                  </Button>
                  <Button
                    type="button"
                    variant={draftFilterLogic === 'or' ? 'default' : 'ghost'}
                    className="h-9 text-xs font-semibold uppercase tracking-wide"
                    onClick={() => setDraftFilterLogic('or')}
                  >
                    OR
                  </Button>
                </div>
              </div>

              {/* Date Range - Unified look */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date Range</Label>
                <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                  <Button variant="ghost" className="flex-1 justify-start font-normal text-slate-600 hover:bg-slate-50 h-9">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    Apr 01, 2026
                  </Button>
                  <span className="text-slate-300 font-medium text-sm px-1">→</span>
                  <Button variant="ghost" className="flex-1 justify-start font-normal text-slate-600 hover:bg-slate-50 h-9">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    Apr 15, 2026
                  </Button>
                </div>
              </div>

              {/* Status - Instantly recognizable checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">QC Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-md cursor-pointer hover:border-blue-400 transition-colors shadow-sm">
                    <Checkbox
                      id="status-graded"
                      checked={draftStatusFilters.includes('GRADED')}
                      onCheckedChange={(checked) => toggleStatusDraft('GRADED', !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Graded
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-md cursor-pointer hover:border-blue-400 transition-colors shadow-sm">
                    <Checkbox
                      id="status-not-graded"
                      checked={draftStatusFilters.includes('NOT_GRADED')}
                      onCheckedChange={(checked) => toggleStatusDraft('NOT_GRADED', !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Ungraded
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {filterableColumns.map(({ id, label, searchable }) => {
                const selectedCount = draftValueFilters[id].length
                const allValues = availableFilterOptions[id]
                const filteredValues = getFilteredOptionsForColumn(id)
                const isExpanded = expandedFilters[id]
                const areAllSelected =
                  allValues.length > 0 && selectedCount === allValues.length

                return (
                  <div key={id} className="space-y-3">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between"
                      onClick={() => toggleFilterSection(id)}
                    >
                      <Label className="cursor-pointer text-sm font-bold text-slate-700 uppercase tracking-wider">
                        {label}
                      </Label>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-600 font-medium">
                          {selectedCount} selected
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                        {searchable && (
                          <div className="relative border-b border-slate-100">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                              value={searchQueries[id]}
                              onChange={(event) =>
                                setColumnSearchQuery(id, event.target.value)
                              }
                              placeholder={`Search ${label.toLowerCase()}...`}
                              className="pl-9 border-0 rounded-none h-10 shadow-none focus-visible:ring-0 text-sm"
                            />
                          </div>
                        )}
                        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">
                          {filteredValues.map((value) => (
                            <label key={value} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                              <Checkbox
                                id={`${id}-${value}`}
                                checked={draftValueFilters[id].includes(value)}
                                onCheckedChange={(checked) =>
                                  toggleValueDraft(id, value, !!checked)
                                }
                              />
                              <span className="text-sm font-medium text-slate-700">{value}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-3 py-2 border-t border-slate-100">
                          <button
                            type="button"
                            className="text-xs text-blue-600 font-medium hover:text-blue-700"
                            onClick={() => handleToggleAllValues(id)}
                          >
                            {areAllSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

            </TabsContent>

            {/* TAB 2: COLUMNS */}
            <TabsContent value="columns" className="m-0 space-y-4 focus-visible:ring-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visible Columns</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-blue-600"
                  onClick={handleShowAll}
                >
                  Show All
                </Button>
              </div>
              <div className="bg-white border border-slate-200 rounded-md shadow-sm divide-y divide-slate-100">
                <DndContext
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleColumnDragEnd}
                  sensors={sensors}
                >
                  <SortableContext
                    items={draftColumnOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedColumns.map((column) => (
                      <SortableColumnRow
                        key={column.id}
                        columnId={column.id}
                        label={columnLabels[column.id] ?? column.id}
                        checked={draftColumnVisibility[column.id] ?? true}
                        onCheckedChange={(checked) =>
                          handleDraftVisibilityChange(column.id, !!checked)
                        }
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </TabsContent>

            {/* TAB 3: GROUPING */}
            <TabsContent value="grouping" className="m-0 space-y-4 focus-visible:ring-0">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Row Grouping</Label>
              <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Add columns, then drag to set grouping priority.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 text-xs text-blue-600"
                    onClick={() => setDraftGrouping([])}
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-3 p-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Grouped Columns
                    </p>
                    {draftGrouping.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500">
                        No groups selected.
                      </div>
                    ) : (
                      <DndContext
                        modifiers={[restrictToVerticalAxis]}
                        onDragMove={handleGroupingDragMove}
                        onDragEnd={handleGroupingDragEnd}
                        sensors={sensors}
                      >
                        <div className="space-y-1">
                          {draftGrouping.map((columnId, index) => {
                            const option = groupingOptions.find((item) => item.id === columnId)
                            if (!option) return null

                            return (
                              <React.Fragment key={columnId}>
                                <GroupingDropZone
                                  index={index}
                                  isActive={activeGroupingDropIndex === index}
                                />
                                <SortableGroupingRow
                                  columnId={columnId}
                                  label={option.label}
                                  groupedIndex={index}
                                  onRemove={() => toggleDraftGrouping(columnId)}
                                />
                              </React.Fragment>
                            )
                          })}
                          <GroupingDropZone
                            index={draftGrouping.length}
                            isActive={activeGroupingDropIndex === draftGrouping.length}
                          />
                        </div>
                      </DndContext>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Available Columns
                    </p>
                    <div className="space-y-1">
                      {groupingOptions
                        .filter((option) => !option.isGrouped)
                        .map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between rounded border border-slate-200 bg-slate-50/60 px-2 py-2"
                          >
                            <span className="text-sm text-slate-700">{option.label}</span>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => toggleDraftGrouping(option.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="m-0 space-y-4 focus-visible:ring-0">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Column Sizing
              </Label>
              <div className="grid gap-3">
                <select
                  value={columnResizeMode}
                  onChange={(event) =>
                    setColumnResizeMode(event.target.value as ColumnResizeMode)
                  }
                  className="h-10 rounded-md border bg-white px-3 text-sm text-slate-700"
                >
                  <option value="onChange">Resize: onChange</option>
                  <option value="onEnd">Resize: onEnd</option>
                </select>
                <select
                  value={columnResizeDirection}
                  onChange={(event) =>
                    setColumnResizeDirection(
                      event.target.value as ColumnResizeDirection,
                    )
                  }
                  className="h-10 rounded-md border bg-white px-3 text-sm text-slate-700"
                >
                  <option value="ltr">Direction: ltr</option>
                  <option value="rtl">Direction: rtl</option>
                </select>
              </div>
            </TabsContent>

          </div>
        </Tabs>

        {/* --- STICKY FOOTER --- */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white">
          <SheetFooter className="flex flex-row justify-between sm:justify-between w-full items-center">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-500 hover:text-slate-800 font-medium px-2 h-9"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-9" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6"
                onClick={handleApplyView}
              >
                Apply View
              </Button>
            </div>
          </SheetFooter>
        </div>

      </SheetContent>
    </Sheet>
  )
}