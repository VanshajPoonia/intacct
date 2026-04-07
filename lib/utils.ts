import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value)
}

export function formatDate(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
) {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat(
    'en-US',
    options ?? {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  ).format(date)
}
