"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Users, 
  Building, 
  Receipt, 
  CreditCard, 
  BookOpen,
  Search,
  Plus
} from "lucide-react"

type EmptyStateType = 
  | 'invoices' | 'bills' | 'customers' | 'vendors' 
  | 'accounts' | 'transactions' | 'search' | 'default'

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const emptyStateConfig: Record<EmptyStateType, { icon: React.ElementType; title: string; description: string }> = {
  invoices: {
    icon: FileText,
    title: 'No invoices yet',
    description: 'Create your first invoice to start tracking accounts receivable.',
  },
  bills: {
    icon: Receipt,
    title: 'No bills yet',
    description: 'Add bills from your vendors to manage accounts payable.',
  },
  customers: {
    icon: Users,
    title: 'No customers yet',
    description: 'Add customers to start creating invoices and tracking payments.',
  },
  vendors: {
    icon: Building,
    title: 'No vendors yet',
    description: 'Add vendors to start managing your bills and payments.',
  },
  accounts: {
    icon: BookOpen,
    title: 'No accounts found',
    description: 'Set up your chart of accounts to start tracking transactions.',
  },
  transactions: {
    icon: CreditCard,
    title: 'No transactions yet',
    description: 'Transactions will appear here as you record activity.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you are looking for.',
  },
  default: {
    icon: FileText,
    title: 'No data available',
    description: 'There is nothing to display at the moment.',
  },
}

export function EmptyState({ 
  type = 'default', 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description || config.description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
