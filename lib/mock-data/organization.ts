import type { Department, Dimension, Employee, Entity, Location, Project } from '@/lib/types'

export const entities: Entity[] = [
  { id: 'e1', name: 'Northstar Holdings', code: 'NSH', type: 'primary', currency: 'USD', status: 'active', country: 'US', timezone: 'America/Chicago' },
  { id: 'e2', name: 'Northstar Manufacturing West', code: 'NSW', type: 'subsidiary', currency: 'USD', status: 'active', parentEntityId: 'e1', country: 'US', timezone: 'America/Los_Angeles' },
  { id: 'e3', name: 'Northstar Europe', code: 'NSEU', type: 'subsidiary', currency: 'EUR', status: 'active', parentEntityId: 'e1', country: 'DE', timezone: 'Europe/Berlin' },
  { id: 'e4', name: 'Northstar Consolidated', code: 'NSC', type: 'consolidated', currency: 'USD', status: 'active', country: 'US', timezone: 'America/Chicago' },
]

export const departments: Department[] = [
  { id: 'd-fin', name: 'Finance', code: 'FIN', status: 'active', entityIds: ['e1', 'e2', 'e3'] },
  { id: 'd-ops', name: 'Operations', code: 'OPS', status: 'active', entityIds: ['e1', 'e2'] },
  { id: 'd-sales', name: 'Sales', code: 'SAL', status: 'active', entityIds: ['e1', 'e3'] },
  { id: 'd-it', name: 'IT', code: 'IT', status: 'active', entityIds: ['e1', 'e2', 'e3'] },
]

export const locations: Location[] = [
  { id: 'l-chi', name: 'Chicago HQ', code: 'CHI', address: '401 W Lake St, Chicago, IL', entityIds: ['e1'], status: 'active' },
  { id: 'l-den', name: 'Denver Plant', code: 'DEN', address: '808 Market St, Denver, CO', entityIds: ['e2'], status: 'active' },
  { id: 'l-ber', name: 'Berlin Office', code: 'BER', address: '16 Friedrichstrasse, Berlin', entityIds: ['e3'], status: 'active' },
]

export const projects: Project[] = [
  { id: 'p-close', name: 'Q1 Close Acceleration', code: 'CLOSE-Q1', budget: 125000, spent: 91000, status: 'active', startDate: new Date('2026-01-08'), entityId: 'e1', departmentId: 'd-fin' },
  { id: 'p-erp', name: 'ERP Data Migration', code: 'ERP-MIG', budget: 220000, spent: 134000, status: 'active', startDate: new Date('2025-11-01'), entityId: 'e1', departmentId: 'd-it' },
  { id: 'p-eu', name: 'EU Shared Services', code: 'EU-SSC', budget: 150000, spent: 102000, status: 'active', startDate: new Date('2025-12-12'), entityId: 'e3', departmentId: 'd-fin' },
]

export const employees: Employee[] = [
  { id: 'emp-1', name: 'Ava Mitchell', email: 'ava.mitchell@northstarfinance.com', departmentId: 'd-fin', locationId: 'l-chi', role: 'Senior Accountant', status: 'active' },
  { id: 'emp-2', name: 'Miles Chen', email: 'miles.chen@northstarfinance.com', departmentId: 'd-fin', locationId: 'l-chi', role: 'Controller', status: 'active' },
  { id: 'emp-3', name: 'Lena Garcia', email: 'lena.garcia@northstarfinance.com', departmentId: 'd-fin', locationId: 'l-den', role: 'AP Specialist', status: 'active' },
  { id: 'emp-4', name: 'Owen Price', email: 'owen.price@northstarfinance.com', departmentId: 'd-sales', locationId: 'l-ber', role: 'AR Specialist', status: 'active' },
]

export const dimensions: Dimension[] = [
  { id: 'dim-fin', name: 'Finance', code: 'FIN', type: 'department', status: 'active', entityIds: ['e1', 'e2', 'e3'], createdAt: new Date('2025-01-01') },
  { id: 'dim-ops', name: 'Operations', code: 'OPS', type: 'department', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2025-01-01') },
  { id: 'dim-it', name: 'IT', code: 'IT', type: 'department', status: 'active', entityIds: ['e1', 'e2', 'e3'], createdAt: new Date('2025-01-01') },
  { id: 'dim-close', name: 'Q1 Close Acceleration', code: 'CLOSE-Q1', type: 'project', status: 'active', entityIds: ['e1'], createdAt: new Date('2025-12-01') },
]
