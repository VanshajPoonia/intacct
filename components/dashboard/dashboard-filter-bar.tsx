"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from "date-fns"
import { CalendarIcon, X, Filter, ChevronDown } from "lucide-react"
import type { 
  DashboardFilters, 
  Entity, 
  Department, 
  Location, 
  Project, 
  Customer, 
  Vendor, 
  Employee 
} from "@/lib/types"
import {
  getEntities,
  getDepartments,
  getLocations,
  getProjects,
  getCustomers,
  getVendors,
  getEmployees,
} from "@/lib/services"

interface DashboardFilterBarProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
}

type DatePreset = DashboardFilters['dateRange']['preset']

const datePresets: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
]

function getDateRangeFromPreset(preset: DatePreset): { startDate: Date; endDate: Date } {
  const now = new Date()
  
  switch (preset) {
    case 'today':
      return { startDate: now, endDate: now }
    case 'this_week':
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      return { startDate: startOfWeek, endDate: now }
    case 'this_month':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    case 'this_quarter':
      return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) }
    case 'this_year':
      return { startDate: startOfYear(now), endDate: endOfYear(now) }
    case 'last_month':
      const lastMonth = subMonths(now, 1)
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) }
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1)
      return { startDate: startOfQuarter(lastQuarter), endDate: endOfQuarter(lastQuarter) }
    case 'last_year':
      const lastYear = subYears(now, 1)
      return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) }
    default:
      return { startDate: startOfYear(now), endDate: now }
  }
}

export function DashboardFilterBar({ filters, onFiltersChange }: DashboardFilterBarProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendorsList, setVendorsList] = useState<Vendor[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    // Load filter options
    Promise.all([
      getEntities(),
      getDepartments(),
      getLocations(),
      getProjects(),
      getCustomers(),
      getVendors(),
      getEmployees(),
    ]).then(([e, d, l, p, c, v, emp]) => {
      setEntities(e)
      setDepartments(d)
      setLocations(l)
      setProjects(p)
      setCustomers(c)
      setVendorsList(v)
      setEmployees(emp)
    })
  }, [])

  const handleEntityChange = (entityId: string) => {
    onFiltersChange({ ...filters, entityId })
  }

  const handleDepartmentChange = (departmentId: string) => {
    onFiltersChange({ 
      ...filters, 
      departmentId: departmentId === '_all' ? undefined : departmentId 
    })
  }

  const handleLocationChange = (locationId: string) => {
    onFiltersChange({ 
      ...filters, 
      locationId: locationId === '_all' ? undefined : locationId 
    })
  }

  const handleProjectChange = (projectId: string) => {
    onFiltersChange({ 
      ...filters, 
      projectId: projectId === '_all' ? undefined : projectId 
    })
  }

  const handleCustomerChange = (customerId: string) => {
    onFiltersChange({ 
      ...filters, 
      customerId: customerId === '_all' ? undefined : customerId 
    })
  }

  const handleVendorChange = (vendorId: string) => {
    onFiltersChange({ 
      ...filters, 
      vendorId: vendorId === '_all' ? undefined : vendorId 
    })
  }

  const handleEmployeeChange = (employeeId: string) => {
    onFiltersChange({ 
      ...filters, 
      employeeId: employeeId === '_all' ? undefined : employeeId 
    })
  }

  const handleDatePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      onFiltersChange({
        ...filters,
        dateRange: { ...filters.dateRange, preset: 'custom' }
      })
    } else {
      const { startDate, endDate } = getDateRangeFromPreset(preset)
      onFiltersChange({
        ...filters,
        dateRange: { startDate, endDate, preset }
      })
    }
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from) {
      onFiltersChange({
        ...filters,
        dateRange: {
          startDate: range.from,
          endDate: range.to || range.from,
          preset: 'custom'
        }
      })
    }
  }

  const clearFilter = (key: keyof DashboardFilters) => {
    const newFilters = { ...filters }
    if (key === 'departmentId') newFilters.departmentId = undefined
    if (key === 'locationId') newFilters.locationId = undefined
    if (key === 'projectId') newFilters.projectId = undefined
    if (key === 'customerId') newFilters.customerId = undefined
    if (key === 'vendorId') newFilters.vendorId = undefined
    if (key === 'employeeId') newFilters.employeeId = undefined
    onFiltersChange(newFilters)
  }

  const activeFilterCount = [
    filters.departmentId,
    filters.locationId,
    filters.projectId,
    filters.customerId,
    filters.vendorId,
    filters.employeeId,
  ].filter(Boolean).length

  const selectedEntity = entities.find(e => e.id === filters.entityId)

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Entity Selector */}
        <Select value={filters.entityId} onValueChange={handleEntityChange}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Select Entity" />
          </SelectTrigger>
          <SelectContent>
            {entities.map(entity => (
              <SelectItem key={entity.id} value={entity.id}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{entity.code}</span>
                  <span>{entity.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Select 
            value={filters.dateRange.preset || 'custom'} 
            onValueChange={(v) => handleDatePresetChange(v as DatePreset)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {datePresets.map(preset => (
                <SelectItem key={preset.value} value={preset.value || 'custom'}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 justify-start text-left font-normal min-w-[220px]",
                  !filters.dateRange.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.startDate ? (
                  filters.dateRange.endDate && filters.dateRange.startDate !== filters.dateRange.endDate ? (
                    <>
                      {format(filters.dateRange.startDate, "MMM d, yyyy")} -{" "}
                      {format(filters.dateRange.endDate, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(filters.dateRange.startDate, "MMM d, yyyy")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange.startDate,
                  to: filters.dateRange.endDate
                }}
                onSelect={(range) => {
                  handleDateRangeChange({ from: range?.from, to: range?.to })
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showAdvanced && "rotate-180")} />
        </Button>
      </div>

      {/* Advanced Filters Row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          {/* Department */}
          <Select value={filters.departmentId || '_all'} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location */}
          <Select value={filters.locationId || '_all'} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project */}
          <Select value={filters.projectId || '_all'} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Projects</SelectItem>
              {projects.map(proj => (
                <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Customer */}
          <Select value={filters.customerId || '_all'} onValueChange={handleCustomerChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Customers</SelectItem>
              {customers.map(cust => (
                <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Vendor */}
          <Select value={filters.vendorId || '_all'} onValueChange={handleVendorChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Vendors</SelectItem>
              {vendorsList.map(vendor => (
                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Employee */}
          <Select value={filters.employeeId || '_all'} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Employees</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {filters.departmentId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Dept: {departments.find(d => d.id === filters.departmentId)?.name}
              <button onClick={() => clearFilter('departmentId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.locationId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Loc: {locations.find(l => l.id === filters.locationId)?.name}
              <button onClick={() => clearFilter('locationId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.projectId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Project: {projects.find(p => p.id === filters.projectId)?.name}
              <button onClick={() => clearFilter('projectId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.customerId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Customer: {customers.find(c => c.id === filters.customerId)?.name}
              <button onClick={() => clearFilter('customerId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.vendorId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Vendor: {vendorsList.find(v => v.id === filters.vendorId)?.name}
              <button onClick={() => clearFilter('vendorId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.employeeId && (
            <Badge variant="secondary" className="h-6 gap-1">
              Employee: {employees.find(e => e.id === filters.employeeId)?.name}
              <button onClick={() => clearFilter('employeeId')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
