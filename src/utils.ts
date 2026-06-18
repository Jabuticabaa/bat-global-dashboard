import type { CountryData, MetricKey } from './types'

export const METRIC_LABELS: Record<MetricKey, string> = {
  gdp: 'GDP (USD)',
  population: 'População',
  bat_share: 'Market Share BAT (%)',
  pos_total: 'Total PDVs',
  pos_bat: 'PDVs BAT',
  pos_active_pct: 'PDVs Ativos (%)',
  os_total: 'Ordens de Serviço',
  productive_pct: 'Produtividade (%)',
}

export function getMetricValue(d: CountryData, key: MetricKey): number | null {
  return (d as any)[key] ?? null
}

export function fmtNumber(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(decimals)
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toFixed(1) + '%'
}

export function colorScale(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  const r = Math.round(0 + t * 201)
  const g = Math.round(48 + t * 87)
  const b = Math.round(135 + t * (-100))
  return `rgb(${r},${g},${b})`
}
