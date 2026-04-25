import type { FarmerTableRecord } from '@/data/farmer-table-data'

export type LogicalOperator = 'AND' | 'OR'
export type FilterField = keyof Pick<
  FarmerTableRecord,
  'gatePassNumber' | 'date' | 'farmer' | 'variety' | 'bags' | 'netWeight' | 'status'
>
export type FilterOperator =
  | '='
  | '!='
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | '>'
  | '>='
  | '<'
  | '<='

export type FilterConditionNode = {
  id: string
  type: 'condition'
  field: FilterField
  operator: FilterOperator
  value: string
}

export type FilterGroupNode = {
  id: string
  type: 'group'
  operator: LogicalOperator
  conditions: FilterNode[]
}

export type FilterNode = FilterConditionNode | FilterGroupNode

const createId = () => Math.random().toString(36).slice(2, 9)

export const numericFilterFields: FilterField[] = ['gatePassNumber', 'bags', 'netWeight']

export const stringFilterFields: FilterField[] = ['date', 'farmer', 'variety', 'status']

export const getDefaultOperatorForField = (field: FilterField): FilterOperator =>
  numericFilterFields.includes(field) ? '=' : 'contains'

export const createDefaultCondition = (field: FilterField = 'farmer'): FilterConditionNode => ({
  id: createId(),
  type: 'condition',
  field,
  operator: getDefaultOperatorForField(field),
  value: '',
})

export const createDefaultFilterGroup = (): FilterGroupNode => ({
  id: createId(),
  type: 'group',
  operator: 'AND',
  conditions: [createDefaultCondition()],
})

export const isAdvancedFilterGroup = (value: unknown): value is FilterGroupNode => {
  if (!value || typeof value !== 'object') return false
  return 'type' in value && (value as { type?: string }).type === 'group'
}

const compareNumeric = (left: number, operator: FilterOperator, right: number) => {
  if (operator === '=') return left === right
  if (operator === '!=') return left !== right
  if (operator === '>') return left > right
  if (operator === '>=') return left >= right
  if (operator === '<') return left < right
  if (operator === '<=') return left <= right
  return false
}

const compareString = (left: string, operator: FilterOperator, right: string) => {
  if (operator === '=') return left === right
  if (operator === '!=') return left !== right
  if (operator === 'contains') return left.includes(right)
  if (operator === 'startsWith') return left.startsWith(right)
  if (operator === 'endsWith') return left.endsWith(right)
  if (operator === '>') return left > right
  if (operator === '>=') return left >= right
  if (operator === '<') return left < right
  if (operator === '<=') return left <= right
  return false
}

const evaluateCondition = (row: FarmerTableRecord, node: FilterConditionNode) => {
  const rawCellValue = row[node.field]
  const rawConditionValue = node.value.trim()
  if (!rawConditionValue) return true

  if (numericFilterFields.includes(node.field)) {
    const left = Number(rawCellValue)
    const right = Number(rawConditionValue)
    if (Number.isNaN(left) || Number.isNaN(right)) return false
    return compareNumeric(left, node.operator, right)
  }

  const left = String(rawCellValue).toLowerCase()
  const right = rawConditionValue.toLowerCase()
  return compareString(left, node.operator, right)
}

export const evaluateFilterGroup = (row: FarmerTableRecord, group: FilterGroupNode): boolean => {
  if (group.conditions.length === 0) return true
  if (group.operator === 'AND') {
    return group.conditions.every((node) => {
      if (node.type === 'condition') return evaluateCondition(row, node)
      return evaluateFilterGroup(row, node)
    })
  }
  return group.conditions.some((node) => {
    if (node.type === 'condition') return evaluateCondition(row, node)
    return evaluateFilterGroup(row, node)
  })
}

export const hasAnyUsableFilter = (group: FilterGroupNode): boolean =>
  group.conditions.some((node) => {
    if (node.type === 'condition') return node.value.trim().length > 0
    return hasAnyUsableFilter(node)
  })
