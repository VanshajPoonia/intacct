export interface Entity {
  id: string
  name: string
  code: string
  type: 'primary' | 'subsidiary' | 'consolidated'
  currency: string
  status: 'active' | 'inactive'
  parentEntityId?: string
  country?: string
  timezone?: string
}

export interface Department {
  id: string
  name: string
  code: string
  managerId?: string
  parentId?: string
  entityIds?: string[]
  status: 'active' | 'inactive'
}

export interface Location {
  id: string
  name: string
  code: string
  address?: string
  entityIds?: string[]
  status: 'active' | 'inactive'
}

export interface Project {
  id: string
  name: string
  code: string
  customerId?: string
  managerId?: string
  budget: number
  spent: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  entityId?: string
  departmentId?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  departmentId: string
  locationId?: string
  role: string
  status: 'active' | 'inactive'
}

export interface Dimension {
  id: string
  name: string
  code: string
  type: 'department' | 'location' | 'project' | 'class' | 'custom'
  status: 'active' | 'inactive'
  parentId?: string
  entityIds: string[]
  createdAt: Date
}
