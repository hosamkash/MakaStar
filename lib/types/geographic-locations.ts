// Base interface for all geographic entities
export interface BaseGeoEntity {
  id: string
  ID?: number
  Name: string
}

// Government interface (remains the same as before)
export interface Government extends BaseGeoEntity {
  // تم إزالة Code و IsActive حسب الموديل الجديد
}

// City interface - updated to match DefGeo_Cities
export interface City extends BaseGeoEntity {
  IDGovernorate: number
}

// Village interface - updated to match DefGeo_Villages  
export interface Village extends BaseGeoEntity {
  IDCity: number
}

// Area interface - updated to match DefGeo_Areas
export interface Area extends BaseGeoEntity {
  IDCity: number
  IDVillage: number
}

// Place interface - updated to match DefGeo_Places
export interface Place extends BaseGeoEntity {
  PlaceType?: string
  Address?: string
  Latitude?: number
  Longitude?: number
  LocationLink?: string
  Phone?: string
  Notes?: string
  ImageLink?: string
  ImageName?: string
  AddedBy?: string
  DateAdded?: string
  IDAreas?: number
  Method1?: string
  Method1TotalTime?: number
  Method1Notes?: string
  Method1Step1Data?: string
  Method1Step1TimeMinutes?: number
  Method1Step2Data?: string
  Method1Step2TimeMinutes?: number
  Method1Step3Data?: string
  Method1Step3TimeMinutes?: number
  Method1Step4Data?: string
  Method1Step4TimeMinutes?: number
  Method1Step5Data?: string
  Method1Step5TimeMinutes?: number
  Method2?: string
  Method2TotalTime?: number
  Method2Notes?: string
  Method2Step1Data?: string
  Method2Step1TimeMinutes?: number
  Method2Step2Data?: string
  Method2Step2TimeMinutes?: number
  Method2Step3Data?: string
  Method2Step3TimeMinutes?: number
  Method2Step4Data?: string
  Method2Step4TimeMinutes?: number
  Method2Step5Data?: string
  Method2Step5TimeMinutes?: number
  Method3?: string
  Method3TotalTime?: number
  Method3Notes?: string
  Method3Step1Data?: string
  Method3Step1TimeMinutes?: number
  Method3Step2Data?: string
  Method3Step2TimeMinutes?: number
  Method3Step3Data?: string
  Method3Step3TimeMinutes?: number
  Method3Step4Data?: string
  Method3Step4TimeMinutes?: number
  Method3Step5Data?: string
  Method3Step5TimeMinutes?: number
  Method4?: string
  Method4TotalTime?: number
  Method4Notes?: string
  Method4Step1Data?: string
  Method4Step1TimeMinutes?: number
  Method4Step2Data?: string
  Method4Step2TimeMinutes?: number
  Method4Step3Data?: string
  Method4Step3TimeMinutes?: number
  Method4Step4Data?: string
  Method4Step4TimeMinutes?: number
  Method4Step5Data?: string
  Method4Step5TimeMinutes?: number
  FullAddressText?: string
}

// Form data interface for all entities
export interface GeoFormData {
  Code: string
  Name: string
  IsActive: boolean
  ParentId?: string
  Type: 'government' | 'city' | 'area' | 'village' | 'place'
}

// Collection names mapping
export const GEO_COLLECTIONS = {
  government: 'Mak.DefGeo_Government',
  city: 'Mak.DefGeo_Cities',
  area: 'Mak.DefGeo_Areas',
  village: 'Mak.DefGeo_Villages',
  place: 'Mak.DefGeo_Places'
} as const

// Parent type mapping
export const PARENT_COLLECTIONS = {
  city: 'DefGeo_Government',
  area: 'DefGeo_Cities',
  village: 'DefGeo_Areas',
  place: 'DefGeo_Villages'
} as const

// Parent field mapping
export const PARENT_FIELDS = {
  city: 'GovernmentId',
  area: 'CityId',
  village: 'AreaId',
  place: 'VillageId'
} as const
