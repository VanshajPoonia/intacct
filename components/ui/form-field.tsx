"use client"

import { type ReactNode, type InputHTMLAttributes, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  className?: string
  inputClassName?: string
  onChange?: (value: string) => void
  multiline?: boolean
  rows?: number
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    {
      label,
      error,
      success,
      hint,
      required,
      className,
      inputClassName,
      id,
      onChange,
      multiline = false,
      rows = 3,
      ...props
    },
    ref
  ) {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    const inputProps = {
      id: fieldId,
      className: cn(
        inputClassName,
        hasError && "border-destructive focus-visible:ring-destructive",
        hasSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
      ),
      "aria-invalid": hasError,
      "aria-describedby": hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(e.target.value)
      },
      ...props,
    }

    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={fieldId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        {multiline ? (
          <Textarea 
            {...inputProps as React.ComponentProps<typeof Textarea>} 
            rows={rows}
          />
        ) : (
          <Input ref={ref} {...inputProps} />
        )}

        {/* Error message */}
        {hasError && (
          <p 
            id={`${fieldId}-error`}
            className="text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        {/* Success message */}
        {hasSuccess && (
          <p className="text-sm text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}

        {/* Hint text */}
        {hint && !hasError && !hasSuccess && (
          <p 
            id={`${fieldId}-hint`}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

// Form section component for grouping fields
interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form actions footer
interface FormActionsProps {
  children: ReactNode
  className?: string
  align?: "left" | "center" | "right" | "between"
}

export function FormActions({ children, className, align = "right" }: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  }

  return (
    <div className={cn(
      "flex items-center gap-3 pt-4 border-t",
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}
