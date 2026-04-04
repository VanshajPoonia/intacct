import type { WorkspaceDetailField, WorkspaceOverviewRow, WorkspaceTone } from '@/lib/types'

export function formatMoney(value: number, currency: string = 'USD', digits: number = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatDateLabel(value?: Date) {
  if (!value) {
    return 'None'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

export function formatDateTimeLabel(value?: Date) {
  if (!value) {
    return 'None'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

export function getStatusTone(status?: string): WorkspaceTone {
  switch (status) {
    case 'approved':
    case 'posted':
    case 'paid':
    case 'completed':
    case 'active':
    case 'matched':
    case 'reconciled':
      return 'positive'
    case 'pending':
    case 'processing':
    case 'draft':
    case 'partial':
    case 'review':
    case 'in_progress':
    case 'unapplied':
    case 'unmatched':
      return 'warning'
    case 'overdue':
    case 'voided':
    case 'reversed':
    case 'failed':
    case 'blocked':
    case 'hold':
      return 'critical'
    default:
      return 'neutral'
  }
}

export function buildOverviewRow(
  id: string,
  title: string,
  options: Omit<WorkspaceOverviewRow, 'id' | 'title'> = {}
): WorkspaceOverviewRow {
  return {
    id,
    title,
    ...options,
  }
}

export function buildDetailField(id: string, label: string, value: string, tone?: WorkspaceTone): WorkspaceDetailField {
  return {
    id,
    label,
    value,
    tone,
  }
}
