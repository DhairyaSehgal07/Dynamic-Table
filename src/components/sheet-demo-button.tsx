import * as React from 'react'
import type {
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
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  SlidersHorizontal,
  Columns3,
  Rows3,
  Calendar as CalendarIcon,
  GripVertical,
  Search,
  ChevronDown,
  Plus,
  Trash2,
  Settings2,
  X,
  CheckCircle2,
  Circle,
  RotateCcw,
} from 'lucide-react'
import type { FarmerTableRecord } from '@/data/farmer-table-data'
import {
  createDefaultCondition,
  createDefaultFilterGroup,
  getDefaultOperatorForField,
  hasAnyUsableFilter,
  isAdvancedFilterGroup,
  numericFilterFields,
  type FilterConditionNode,
  type FilterField,
  type FilterGroupNode,
  type FilterNode,
  type FilterOperator,
} from '@/lib/advanced-filters'

type SheetDemoButtonProps = {
  table: TanstackTable<FarmerTableRecord>
  defaultColumnOrder: string[]
  columnResizeMode: 'onChange' | 'onEnd'
  columnResizeDirection: 'ltr' | 'rtl'
  onColumnResizeModeChange: (mode: 'onChange' | 'onEnd') => void
  onColumnResizeDirectionChange: (direction: 'ltr' | 'rtl') => void
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
  { id: 'gatePassNumber', label: 'Gate Pass No.', searchable: true },
  { id: 'date', label: 'Date', searchable: true },
  { id: 'farmer', label: 'Farmer', searchable: true },
  { id: 'variety', label: 'Crop Variety', searchable: true },
  { id: 'bags', label: 'Bags', searchable: true },
  { id: 'netWeight', label: 'Net Weight (kg)', searchable: true },
]

const advancedFilterFields: Array<{ id: FilterField; label: string; type: 'string' | 'number' }> = [
  { id: 'gatePassNumber', label: 'Gate Pass Number', type: 'number' },
  { id: 'date', label: 'Date', type: 'string' },
  { id: 'farmer', label: 'Farmer', type: 'string' },
  { id: 'variety', label: 'Variety', type: 'string' },
  { id: 'bags', label: 'Bags', type: 'number' },
  { id: 'netWeight', label: 'Net Weight (kg)', type: 'number' },
  { id: 'status', label: 'Status', type: 'string' },
]

const stringOperators: FilterOperator[] = ['contains', '=', '!=', 'startsWith', 'endsWith']
const numberOperators: FilterOperator[] = ['=', '!=', '>', '>=', '<', '<=']
const filterOperatorLabels: Record<FilterOperator, string> = {
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  '=': 'equals',
  '!=': 'not equal',
  '>': 'greater than',
  '>=': '≥ greater or equal',
  '<': 'less than',
  '<=': '≤ less or equal',
}

const statusFilterOptions = ['GRADED', 'NOT_GRADED']

const mutateFilterNodeById = (
  group: FilterGroupNode,
  targetId: string,
  updater: (node: FilterNode) => FilterNode,
): FilterGroupNode => {
  if (group.id === targetId) {
    const updatedNode = updater(group)
    if (updatedNode.type === 'group') return updatedNode
    return group
  }
  return {
    ...group,
    conditions: group.conditions.map((node) => {
      if (node.id === targetId) return updater(node)
      if (node.type === 'group') return mutateFilterNodeById(node, targetId, updater)
      return node
    }),
  }
}

const removeFilterNodeById = (group: FilterGroupNode, nodeId: string): FilterGroupNode => ({
  ...group,
  conditions: group.conditions
    .filter((node) => node.id !== nodeId)
    .map((node) => (node.type === 'group' ? removeFilterNodeById(node, nodeId) : node)),
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortableColumnRow({
  columnId,
  label,
  checked,
  onCheckedChange,
}: {
  columnId: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: columnId })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-3 py-2.5 transition-colors group rounded-md ${
        checked ? 'bg-white' : 'bg-slate-50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Reorder ${label}`}
          className="cursor-grab text-slate-300 group-hover:text-slate-400 active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm text-slate-700 select-none">{label}</span>
      </div>
      <Switch
        id={`col-${columnId}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-blue-600 scale-90"
      />
    </div>
  )
}

function SortableGroupingRow({
  columnId,
  label,
  groupedIndex,
  onRemove,
}: {
  columnId: string
  label: string
  groupedIndex: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `grouping-item:${columnId}`,
  })
  const style = { transform: CSS.Transform.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-2 py-2"
    >
      <button
        type="button"
        aria-label={`Reorder ${label}`}
        className="cursor-grab text-blue-300 hover:text-blue-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
        {groupedIndex + 1}
      </span>
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Remove ${label} from grouping`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function GroupingDropZone({ index, isActive }: { index: number; isActive: boolean }) {
  const { setNodeRef } = useDroppable({ id: `grouping-slot:${index}` })
  return (
    <div
      ref={setNodeRef}
      className={`h-1.5 rounded transition-all ${isActive ? 'bg-blue-400' : 'bg-transparent'}`}
      aria-hidden
    />
  )
}

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center">
      <div className="text-slate-300">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>
      {action}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SheetDemoButton({
  table,
  defaultColumnOrder,
  columnResizeMode,
  columnResizeDirection,
  onColumnResizeModeChange,
  onColumnResizeDirectionChange,
}: SheetDemoButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('filters')
  const [searchQueries, setSearchQueries] = React.useState<Record<FilterableColumnId, string>>({
    gatePassNumber: '', date: '', farmer: '', variety: '', bags: '', netWeight: '',
  })
  const [expandedFilters, setExpandedFilters] = React.useState<Record<FilterableColumnId, boolean>>({
    gatePassNumber: false, date: false, farmer: false, variety: false, bags: false, netWeight: false,
  })
  const [draftColumnVisibility, setDraftColumnVisibility] = React.useState<Record<string, boolean>>({})
  const [draftColumnOrder, setDraftColumnOrder] = React.useState<string[]>([])
  const [draftStatusFilters, setDraftStatusFilters] = React.useState<StatusFilterValue[]>(['GRADED', 'NOT_GRADED'])
  const [draftValueFilters, setDraftValueFilters] = React.useState<Record<FilterableColumnId, string[]>>({
    gatePassNumber: [], date: [], farmer: [], variety: [], bags: [], netWeight: [],
  })
  const [draftGrouping, setDraftGrouping] = React.useState<string[]>([])
  const [draftLogicFilter, setDraftLogicFilter] = React.useState<FilterGroupNode>(createDefaultFilterGroup())

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  )

  const availableFilterOptions = React.useMemo<Record<FilterableColumnId, string[]>>(() => {
    const options: Record<FilterableColumnId, string[]> = {
      gatePassNumber: [], date: [], farmer: [], variety: [], bags: [], netWeight: [],
    }
    filterableColumns.forEach(({ id }) => {
      const facetedValues = table.getColumn(id)?.getFacetedUniqueValues()
      if (facetedValues) {
        options[id] = Array.from(facetedValues.keys())
          .map((value) => String(value))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      }
    })
    return options
  }, [table])

  const hidableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide())
  const hidableColumnIds = hidableColumns.map((column) => column.id)
  const columnMap = new Map(hidableColumns.map((column) => [column.id, column]))
  const orderedColumns = draftColumnOrder
    .map((columnId) => columnMap.get(columnId))
    .filter((column) => column !== undefined)

  const advancedFieldValueOptions = React.useMemo<Record<FilterField, string[]>>(() => {
    const options: Record<FilterField, string[]> = {
      gatePassNumber: [], date: [], farmer: [], variety: [], bags: [], netWeight: [],
      status: [...statusFilterOptions],
    }
    advancedFilterFields.forEach(({ id }) => {
      const facetedValues = table.getColumn(id)?.getFacetedUniqueValues()
      if (!facetedValues) return
      const values = Array.from(facetedValues.keys()).map((value) => String(value))
      options[id] = numericFilterFields.includes(id)
        ? values.sort((a, b) => Number(a) - Number(b))
        : values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    })
    if (options.status.length === 0) options.status = [...statusFilterOptions]
    return options
  }, [table])

  // ─── Derived: active filter counts for badge ─────────────────────────────

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (draftStatusFilters.length < 2) count++
    filterableColumns.forEach(({ id }) => {
      const all = availableFilterOptions[id]
      if (all.length > 0 && draftValueFilters[id].length < all.length) count++
    })
    if (hasAnyUsableFilter(draftLogicFilter)) count++
    return count
  }, [draftStatusFilters, draftValueFilters, draftLogicFilter, availableFilterOptions])

  const activeColumnCount = React.useMemo(
    () => Object.values(draftColumnVisibility).filter((v) => !v).length,
    [draftColumnVisibility],
  )
  const tabItems = React.useMemo(() => ([
    {
      value: 'filters',
      label: 'Filters',
      description: 'Refine rows by status, date range, and column values.',
      icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
      badge: activeFilterCount || undefined,
    },
    {
      value: 'columns',
      label: 'Columns',
      description: 'Show, hide, and reorder columns for the perfect table view.',
      icon: <Columns3 className="h-3.5 w-3.5" />,
      badge: activeColumnCount > 0 ? `${activeColumnCount} hidden` : undefined,
    },
    {
      value: 'grouping',
      label: 'Grouping',
      description: 'Group rows to compare records in meaningful sections.',
      icon: <Rows3 className="h-3.5 w-3.5" />,
      badge: draftGrouping.length > 0 ? draftGrouping.length : undefined,
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Build custom logic and configure table resize behavior.',
      icon: <Settings2 className="h-3.5 w-3.5" />,
      badge: undefined,
    },
  ]), [activeFilterCount, activeColumnCount, draftGrouping.length])
  const activeTabMeta = tabItems.find((tab) => tab.value === activeTab) ?? tabItems[0]

  // ─── Sync / apply ────────────────────────────────────────────────────────

  const syncDraftFromTable = () => {
    const nextDraft: Record<string, boolean> = {}
    hidableColumns.forEach((column) => { nextDraft[column.id] = column.getIsVisible() })
    const activeOrder = table.getState().columnOrder
    const baseOrder = activeOrder.length > 0 ? activeOrder : defaultColumnOrder
    const validOrder = baseOrder.filter((id) => hidableColumnIds.includes(id))
    const missing = hidableColumnIds.filter((id) => !validOrder.includes(id))
    setDraftColumnVisibility(nextDraft)
    setDraftColumnOrder([...validOrder, ...missing])

    const rawStatusFilter = table.getColumn('status')?.getFilterValue()
    setDraftStatusFilters(Array.isArray(rawStatusFilter) ? rawStatusFilter as StatusFilterValue[] : ['GRADED', 'NOT_GRADED'])

    const nextValueFilters: Record<FilterableColumnId, string[]> = {
      gatePassNumber: [], date: [], farmer: [], variety: [], bags: [], netWeight: [],
    }
    filterableColumns.forEach(({ id }) => {
      const rawFilter = table.getColumn(id)?.getFilterValue()
      nextValueFilters[id] = Array.isArray(rawFilter)
        ? rawFilter.map((value) => String(value))
        : [...availableFilterOptions[id]]
    })
    setDraftValueFilters(nextValueFilters)
    setDraftGrouping(table.getState().grouping)
    const activeGlobalFilter = table.getState().globalFilter
    setDraftLogicFilter(isAdvancedFilterGroup(activeGlobalFilter) ? activeGlobalFilter : createDefaultFilterGroup())
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (nextOpen) {
      syncDraftFromTable()
      setActiveTab('filters')
      setSearchQueries({ gatePassNumber: '', date: '', farmer: '', variety: '', bags: '', netWeight: '' })
      setExpandedFilters({ gatePassNumber: false, date: false, farmer: false, variety: false, bags: false, netWeight: false })
    }
  }

  const handleClearAll = () => {
    const resetVisibility: Record<string, boolean> = {}
    hidableColumns.forEach((column) => { resetVisibility[column.id] = true })
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
    setSearchQueries({ gatePassNumber: '', date: '', farmer: '', variety: '', bags: '', netWeight: '' })
    setExpandedFilters({ gatePassNumber: false, date: false, farmer: false, variety: false, bags: false, netWeight: false })
    setDraftLogicFilter(createDefaultFilterGroup())
    table.setColumnVisibility({})
    table.setColumnOrder(resetOrder)
    table.resetColumnFilters()
    table.setGlobalFilter('')
    table.setGrouping([])
    table.resetColumnSizing()
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
    if (hasAnyUsableFilter(draftLogicFilter)) {
      table.setGlobalFilter(draftLogicFilter)
    } else if (isAdvancedFilterGroup(table.getState().globalFilter)) {
      table.setGlobalFilter('')
    }
    setIsOpen(false)
  }

  // ─── Filter helpers ───────────────────────────────────────────────────────

  const toggleStatusDraft = (status: StatusFilterValue, checked: boolean) => {
    setDraftStatusFilters((current) =>
      checked ? (current.includes(status) ? current : [...current, status]) : current.filter((v) => v !== status)
    )
  }

  const toggleValueDraft = (columnId: FilterableColumnId, value: string, checked: boolean) => {
    setDraftValueFilters((current) => {
      const currentValues = current[columnId]
      if (checked) {
        return currentValues.includes(value) ? current : { ...current, [columnId]: [...currentValues, value] }
      }
      return { ...current, [columnId]: currentValues.filter((v) => v !== value) }
    })
  }

  const handleToggleAllValues = (columnId: FilterableColumnId) => {
    const allValues = availableFilterOptions[columnId]
    const areAllSelected = allValues.length > 0 && draftValueFilters[columnId].length === allValues.length
    setDraftValueFilters((current) => ({ ...current, [columnId]: areAllSelected ? [] : [...allValues] }))
  }

  const getFilteredOptionsForColumn = (columnId: FilterableColumnId) => {
    const query = searchQueries[columnId].trim().toLowerCase()
    const allValues = availableFilterOptions[columnId]
    return query ? allValues.filter((option) => option.toLowerCase().includes(query)) : allValues
  }

  // ─── Logic filter helpers ─────────────────────────────────────────────────

  const setGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, groupId, (node) =>
        node.type === 'group' ? { ...node, operator } : node
      )
    )
  }

  const addConditionToGroup = (groupId: string) => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, groupId, (node) =>
        node.type === 'group' ? { ...node, conditions: [...node.conditions, createDefaultCondition()] } : node
      )
    )
  }

  const addNestedGroup = (groupId: string) => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, groupId, (node) =>
        node.type === 'group' ? { ...node, conditions: [...node.conditions, createDefaultFilterGroup()] } : node
      )
    )
  }

  const removeNode = (nodeId: string) => {
    setDraftLogicFilter((current) => removeFilterNodeById(current, nodeId))
  }

  const setConditionField = (conditionId: string, field: FilterField) => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, conditionId, (node) => {
        if (node.type !== 'condition') return node
        return { ...node, field, operator: getDefaultOperatorForField(field), value: '' }
      })
    )
  }

  const setConditionOperator = (conditionId: string, operator: FilterOperator) => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, conditionId, (node) =>
        node.type === 'condition' ? { ...node, operator } : node
      )
    )
  }

  const setConditionValue = (conditionId: string, value: string) => {
    setDraftLogicFilter((current) =>
      mutateFilterNodeById(current, conditionId, (node) =>
        node.type === 'condition' ? { ...node, value } : node
      )
    )
  }

  // ─── Column drag ─────────────────────────────────────────────────────────

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

  // ─── Grouping drag ────────────────────────────────────────────────────────

  const [activeGroupingDropIndex, setActiveGroupingDropIndex] = React.useState<number | null>(null)
  const parseGroupingColumnId = (id: string) => id.replace('grouping-item:', '')
  const parseGroupingSlotIndex = (id: string) => Number(id.replace('grouping-slot:', ''))

  const handleGroupingDragMove = (event: { over: { id: string | number } | null }) => {
    if (!event.over) { setActiveGroupingDropIndex(null); return }
    const overId = String(event.over.id)
    if (overId.startsWith('grouping-slot:')) {
      const index = parseGroupingSlotIndex(overId)
      if (!Number.isNaN(index)) { setActiveGroupingDropIndex(index); return }
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
      if (!Number.isNaN(parsedIndex)) targetIndex = parsedIndex
    } else if (overId.startsWith('grouping-item:')) {
      const overColumnId = parseGroupingColumnId(overId)
      const overIndex = draftGrouping.findIndex((id) => id === overColumnId)
      if (overIndex >= 0) targetIndex = overIndex
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

  const toggleDraftGrouping = (columnId: string) => {
    setDraftGrouping((current) =>
      current.includes(columnId) ? current.filter((id) => id !== columnId) : [...current, columnId]
    )
  }

  // ─── Labels ───────────────────────────────────────────────────────────────

  const columnLabels: Record<string, string> = {
    gatePassNumber: 'Gate Pass No.',
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

  // ─── Render logic-filter group (recursive) ────────────────────────────────

  const renderGroup = (group: FilterGroupNode, depth = 0): React.ReactNode => (
    <div
      key={group.id}
      className={`space-y-2 rounded-lg border p-3 ${
        depth > 0
          ? 'border-slate-200 bg-slate-50'
          : 'border-blue-100 bg-white'
      }`}
    >
      {/* Group header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Match</span>
        <div className="flex rounded-md border border-slate-200 overflow-hidden">
          {(['AND', 'OR'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setGroupOperator(group.id, op)}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${
                group.operator === op
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {op === 'AND' ? 'All' : 'Any'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">of these conditions</span>
        <div className="ml-auto flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => addConditionToGroup(group.id)}
          >
            <Plus className="h-3 w-3" /> Condition
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => addNestedGroup(group.id)}
          >
            <Plus className="h-3 w-3" /> Group
          </Button>
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-1.5">
        {group.conditions.length === 0 ? (
          <div className="rounded border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">
            No conditions yet — add one above
          </div>
        ) : (
          group.conditions.map((node) => {
            if (node.type === 'group') {
              return (
                <div key={node.id}>
                  {renderGroup(node, depth + 1)}
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => removeNode(node.id)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove group
                    </button>
                  </div>
                </div>
              )
            }

            const isNumeric = numericFilterFields.includes(node.field)
            const operators = isNumeric ? numberOperators : stringOperators
            const valueOptions = advancedFieldValueOptions[node.field] ?? []

            return (
              <div
                key={node.id}
                className="grid grid-cols-12 gap-1.5 items-center rounded-md border border-slate-100 bg-slate-50 p-1.5"
              >
                {/* Field */}
                <select
                  value={node.field}
                  onChange={(e) => setConditionField(node.id, e.target.value as FilterField)}
                  className="col-span-4 h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  {advancedFilterFields.map((field) => (
                    <option key={field.id} value={field.id}>{field.label}</option>
                  ))}
                </select>
                {/* Operator */}
                <select
                  value={node.operator}
                  onChange={(e) => setConditionOperator(node.id, e.target.value as FilterConditionNode['operator'])}
                  className="col-span-3 h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>{filterOperatorLabels[op]}</option>
                  ))}
                </select>
                {/* Value */}
                <select
                  value={node.value}
                  onChange={(e) => setConditionValue(node.id, e.target.value)}
                  className="col-span-4 h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">{valueOptions.length > 0 ? 'Select value…' : 'No values'}</option>
                  {valueOptions.map((value) => (
                    <option key={`${node.id}-${value}`} value={value}>{value}</option>
                  ))}
                </select>
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeNode(node.id)}
                  className="col-span-1 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                  aria-label="Remove condition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 text-slate-600 font-medium shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
            View & Filters
            {(activeFilterCount > 0 || activeColumnCount > 0 || draftGrouping.length > 0) && (
              <span className="ml-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount + (activeColumnCount > 0 ? 1 : 0) + (draftGrouping.length > 0 ? 1 : 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="flex flex-col p-0 gap-0 bg-slate-50 border-l data-[side=right]:w-[92vw] data-[side=right]:max-w-none data-[side=right]:sm:max-w-[640px]"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between pl-5 pr-14 py-4 border-b border-slate-200 bg-white">
            <div>
              <SheetTitle className="text-base font-semibold text-slate-800">Customize View</SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                Changes apply when you click Save.
              </SheetDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-slate-500 text-xs mr-1"
                  onClick={handleClearAll}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset all
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Reset all filters, columns & grouping</TooltipContent>
            </Tooltip>
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pt-3 pb-3 bg-white border-b border-slate-200">
              <TabsList className="grid w-full grid-cols-4 h-11 bg-slate-100/70 p-1 rounded-xl border border-slate-200">
                {tabItems.map(({ value, label, icon, badge }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="gap-1.5 text-xs font-medium rounded-lg border border-transparent text-slate-600 transition-all
                      data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm data-[state=active]:border-slate-200
                      data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:hover:bg-white/70"
                  >
                    {icon}
                    {label}
                    {badge !== undefined && (
                      <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold leading-4 ${
                        activeTab === value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <p className="mt-2.5 text-xs text-slate-500">{activeTabMeta.description}</p>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* ── TAB: FILTERS ── */}
              <TabsContent value="filters" className="m-0 focus-visible:ring-0">
                <div className="p-5 space-y-6">

                  {/* QC Status */}
                  <div>
                    <SectionLabel>QC Status</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'GRADED' as StatusFilterValue, label: 'Graded', color: 'bg-emerald-500' },
                        { value: 'NOT_GRADED' as StatusFilterValue, label: 'Ungraded', color: 'bg-amber-400' },
                      ]).map(({ value, label, color }) => {
                        const checked = draftStatusFilters.includes(value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleStatusDraft(value, !checked)}
                            className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all ${
                              checked
                                ? 'border-blue-200 bg-blue-50 shadow-sm'
                                : 'border-slate-200 bg-white opacity-60'
                            }`}
                          >
                            {checked
                              ? <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                              : <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                            }
                            <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <SectionLabel>Date Range</SectionLabel>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                      <Button variant="ghost" className="flex-1 justify-start gap-2 font-normal text-slate-600 hover:bg-slate-50 h-8 text-sm">
                        <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                        Apr 01, 2026
                      </Button>
                      <span className="text-slate-300 text-sm">→</span>
                      <Button variant="ghost" className="flex-1 justify-start gap-2 font-normal text-slate-600 hover:bg-slate-50 h-8 text-sm">
                        <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                        Apr 15, 2026
                      </Button>
                    </div>
                  </div>

                  {/* Column value filters */}
                  <div className="space-y-2">
                    <SectionLabel>Column Filters</SectionLabel>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden">
                      {filterableColumns.map(({ id, label, searchable }) => {
                        const selectedCount = draftValueFilters[id].length
                        const allValues = availableFilterOptions[id]
                        const filteredValues = getFilteredOptionsForColumn(id)
                        const isExpanded = expandedFilters[id]
                        const areAllSelected = allValues.length > 0 && selectedCount === allValues.length
                        const hasPartialFilter = !areAllSelected && selectedCount > 0

                        return (
                          <div key={id}>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                              onClick={() => setExpandedFilters((c) => ({ ...c, [id]: !c[id] }))}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">{label}</span>
                                {hasPartialFilter && (
                                  <span className="rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-700">
                                    {selectedCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {areAllSelected && (
                                  <span className="text-[10px] text-slate-400">All</span>
                                )}
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-slate-100">
                                {searchable && (
                                  <div className="relative border-b border-slate-100">
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                      value={searchQueries[id]}
                                      onChange={(e) => setSearchQueries((c) => ({ ...c, [id]: e.target.value }))}
                                      placeholder={`Search ${label.toLowerCase()}…`}
                                      className="w-full pl-8 pr-3 py-2 text-sm text-slate-700 bg-slate-50 placeholder:text-slate-400 border-0 focus:outline-none focus:ring-0"
                                    />
                                  </div>
                                )}
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredValues.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-slate-400">No matches</p>
                                  ) : (
                                    filteredValues.map((value) => (
                                      <label
                                        key={value}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={draftValueFilters[id].includes(value)}
                                          onCheckedChange={(checked) => toggleValueDraft(id, value, !!checked)}
                                          className="h-3.5 w-3.5"
                                        />
                                        <span className="text-sm text-slate-700">{value}</span>
                                      </label>
                                    ))
                                  )}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 bg-slate-50/60">
                                  <span className="text-xs text-slate-400">
                                    {selectedCount} of {allValues.length} selected
                                  </span>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    onClick={() => handleToggleAllValues(id)}
                                  >
                                    {areAllSelected ? 'Deselect all' : 'Select all'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: COLUMNS ── */}
              <TabsContent value="columns" className="m-0 focus-visible:ring-0">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Column Visibility & Order</SectionLabel>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() =>
                        setDraftColumnVisibility((c) => {
                          const next = { ...c }
                          hidableColumns.forEach((col) => { next[col.id] = true })
                          return next
                        })
                      }
                    >
                      Show all
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 -mt-2">Drag rows to reorder. Toggle to show/hide.</p>
                  <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                    <DndContext
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={handleColumnDragEnd}
                      sensors={sensors}
                    >
                      <SortableContext items={draftColumnOrder} strategy={verticalListSortingStrategy}>
                        {orderedColumns.map((column) => (
                          <SortableColumnRow
                            key={column.id}
                            columnId={column.id}
                            label={columnLabels[column.id] ?? column.id}
                            checked={draftColumnVisibility[column.id] ?? true}
                            onCheckedChange={(checked) =>
                              setDraftColumnVisibility((c) => ({ ...c, [column.id]: !!checked }))
                            }
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: GROUPING ── */}
              <TabsContent value="grouping" className="m-0 focus-visible:ring-0">
                <div className="p-5 space-y-5">
                  <div>
                    <SectionLabel
                      action={
                        draftGrouping.length > 0 ? (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                            onClick={() => setDraftGrouping([])}
                          >
                            Clear all
                          </button>
                        ) : undefined
                      }
                    >
                      Active Groups
                    </SectionLabel>
                    {draftGrouping.length === 0 ? (
                      <EmptyState
                        icon={<Rows3 className="h-8 w-8" />}
                        title="No groups yet"
                        description="Add columns from below to group rows together"
                      />
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
                                <GroupingDropZone index={index} isActive={activeGroupingDropIndex === index} />
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

                  <div>
                    <SectionLabel>Available Columns</SectionLabel>
                    <div className="space-y-1.5">
                      {groupingOptions.filter((o) => !o.isGrouped).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">All columns are grouped.</p>
                      ) : (
                        groupingOptions.filter((o) => !o.isGrouped).map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <span className="text-sm text-slate-700">{option.label}</span>
                            <button
                              type="button"
                              onClick={() => toggleDraftGrouping(option.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB: ADVANCED ── */}
              <TabsContent value="advanced" className="m-0 focus-visible:ring-0">
                <div className="p-5 space-y-6">
                  {/* Logic Filter Builder */}
                  <div>
                    <SectionLabel
                      action={
                        <button
                          type="button"
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                          onClick={() => setDraftLogicFilter(createDefaultFilterGroup())}
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      }
                    >
                      Logic Builder
                    </SectionLabel>
                    <p className="text-xs text-slate-400 mb-3">
                      Combine filters with AND / OR logic. E.g. status is Graded AND bags &gt; 10.
                    </p>
                    {renderGroup(draftLogicFilter)}
                  </div>

                  <div>
                    <SectionLabel
                      action={
                        <button
                          type="button"
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                          onClick={() => {
                            onColumnResizeModeChange('onChange')
                            onColumnResizeDirectionChange('ltr')
                            table.resetColumnSizing()
                          }}
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      }
                    >
                      Column Resizing
                    </SectionLabel>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                          Resize Mode
                        </p>
                        <div className="flex gap-2">
                          {([
                            { value: 'onChange' as const, label: 'Live (onChange)' },
                            { value: 'onEnd' as const, label: 'On release (onEnd)' },
                          ]).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => onColumnResizeModeChange(option.value)}
                              className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                                columnResizeMode === option.value
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                          Resize Direction
                        </p>
                        <div className="flex gap-2">
                          {([
                            { value: 'ltr' as const, label: 'Left to right' },
                            { value: 'rtl' as const, label: 'Right to left' },
                          ]).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => onColumnResizeDirectionChange(option.value)}
                              className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                                columnResizeDirection === option.value
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => table.resetColumnSizing()}
                      >
                        Reset all column widths
                      </Button>
                    </div>
                  </div>

                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-sm text-slate-500 hover:text-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 shadow-sm"
              onClick={handleApplyView}
            >
              Save & Apply
            </Button>
          </div>

        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}