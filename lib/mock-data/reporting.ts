import type { BudgetTarget } from '@/lib/types'

export const budgetTargets: BudgetTarget[] = [
  { category: 'Revenue', entityId: 'e1', departmentId: 'd-sales', projectId: 'p-close', budget: 5250000, actual: 5039000 },
  { category: 'Cost of Sales', entityId: 'e2', departmentId: 'd-ops', budget: 2550000, actual: 2490000 },
  { category: 'Payroll', entityId: 'e1', departmentId: 'd-fin', budget: 1180000, actual: 1160000 },
  { category: 'Marketing', entityId: 'e1', departmentId: 'd-sales', budget: 210000, actual: 192000 },
  { category: 'Professional Services', entityId: 'e1', departmentId: 'd-fin', budget: 125000, actual: 138000 },
]
