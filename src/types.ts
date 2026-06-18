export interface CityData {
  city: string
  state: string
  lat: number
  lng: number
  loc_key: string
  country: string
  region: string
  os_total: number
  os_productive: number
  productive_pct: number
  sla_avg_days: number | null
  avg_rating: number | null
  top_campaigns: Record<string, number>
  statuses: Record<string, number>
  data_type: string
}

export interface RegionData {
  region: string
  country: string
  gdp: number | null
  population: number | null
  bat_share: number | null
  pos_total: number | null
  pos_bat: number | null
  pos_active: number | null
  pos_active_pct: number | null
  lat: number | null
  lng: number | null
  os_total?: number
  os_productive?: number
  productive_pct?: number
  data_type: string
  cities: Record<string, CityData>
}

export interface CountryData {
  country: string
  subregion: string
  continent: string
  gdp: number | null
  population: number | null
  bat_share: number | null
  pos_total: number | null
  pos_bat: number | null
  pos_active: number | null
  pos_active_pct: number | null
  data_type: string
  regions: Record<string, RegionData>
}

export interface HierarchyData {
  level: 0
  name: string
  continents: Record<string, {
    level: 1
    name: string
    subregions: Record<string, {
      level: 2
      name: string
      continent: string
      countries: Record<string, CountryData>
    }>
  }>
}

export type DrillLevel = 'world' | 'continent' | 'subregion' | 'country' | 'region' | 'city'

export interface DrillState {
  level: DrillLevel
  continent?: string
  subregion?: string
  country?: string
  region?: string
  city?: string
}

export type MetricKey =
  | 'gdp' | 'population' | 'bat_share' | 'pos_total' | 'pos_bat'
  | 'pos_active_pct' | 'os_total' | 'productive_pct'
