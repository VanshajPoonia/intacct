export type FixedAssetsSectionId = 'asset_register' | 'depreciation' | 'lifecycle_events'

export interface FixedAsset {
  id: string
  assetNumber: string
  name: string
  entityId: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  category: 'equipment' | 'software' | 'leasehold' | 'vehicle' | 'furniture'
  status: 'draft' | 'active' | 'in_service' | 'hold' | 'disposed'
  capitalizationStatus: 'queued' | 'capitalized' | 'needs_review'
  acquisitionDate: Date
  inServiceDate?: Date
  cost: number
  accumulatedDepreciation: number
  netBookValue: number
  salvageValue: number
  usefulLifeMonths: number
  depreciationMethod: 'straight_line' | 'declining_balance'
  bookId: string
  bookName: string
  vendorName?: string
  locationName?: string
  serialNumber?: string
  updatedAt: Date
}

export interface AssetBook {
  id: string
  assetId: string
  entityId: string
  name: string
  bookType: 'corporate' | 'tax' | 'local'
  depreciationMethod: 'straight_line' | 'declining_balance'
  usefulLifeMonths: number
  inServiceDate: Date
  costBasis: number
  accumulatedDepreciation: number
  netBookValue: number
  status: 'active' | 'hold' | 'closed'
}

export interface DepreciationScheduleLine {
  id: string
  assetId: string
  assetName: string
  entityId: string
  departmentId?: string
  projectId?: string
  periodLabel: string
  scheduledDate: Date
  depreciationAmount: number
  accumulatedDepreciation: number
  endingBookValue: number
  status: 'scheduled' | 'posted' | 'exception'
  bookId: string
  bookName: string
}

export interface AssetLifecycleEvent {
  id: string
  assetId: string
  assetName: string
  entityId: string
  eventType: 'created' | 'capitalized' | 'transferred' | 'depreciated' | 'disposed' | 'reclassed'
  eventDate: Date
  description: string
  status: 'completed' | 'pending' | 'exception'
  amount?: number
  userName: string
}

export interface DepreciationPreview {
  assetId: string
  assetName: string
  nextPeriodAmount: number
  remainingLifeMonths: number
  projectedEndValue: number
}
