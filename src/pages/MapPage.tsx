import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useHierarchy, useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import type { DrillState, MetricKey } from '../types'
import { METRIC_LABELS, fmtNumber, fmtPct } from '../utils'

const METRICS: MetricKey[] = ['bat_share', 'pos_bat', 'pos_active_pct', 'gdp', 'population', 'os_total', 'productive_pct']

function BreadCrumb({ drill, onDrill }: { drill: DrillState; onDrill: (d: DrillState) => void }) {
  const crumbs: { label: string; state: DrillState }[] = [
    { label: 'Mundo', state: { level: 'world' as const } },
  ]
  if (drill.continent) crumbs.push({ label: drill.continent, state: { level: 'continent' as const, continent: drill.continent } })
  if (drill.subregion) crumbs.push({ label: drill.subregion, state: { level: 'subregion' as const, continent: drill.continent, subregion: drill.subregion } })
  if (drill.country)   crumbs.push({ label: drill.country, state: { level: 'country' as const, continent: drill.continent, subregion: drill.subregion, country: drill.country } })
  if (drill.region)    crumbs.push({ label: drill.region, state: { ...drill, level: 'region' as const } })

  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-600">/</span>}
          <button
            onClick={() => onDrill(c.state)}
            className="text-bat-gold hover:underline"
          >{c.label}</button>
        </span>
      ))}
      {drill.level !== 'world' && (
        <span className="text-gray-400 ml-1 text-xs">
          ({drill.level === 'continent' ? 'sub-regiões' :
            drill.level === 'subregion' ? 'países' :
            drill.level === 'country' ? 'regiões' :
            drill.level === 'region' ? 'cidades' : ''})
        </span>
      )}
    </div>
  )
}

interface MarkerPoint {
  lat: number
  lng: number
  label: string
  value: number | null
  sub?: string
  nextDrill?: DrillState
}

export default function MapPage() {
  const { data: hierarchy, loading: hl } = useHierarchy()
  const { data: countries, loading: cl } = useCountries()
  const [drill, setDrill] = useState<DrillState>({ level: 'world' })
  const [metric, setMetric] = useState<MetricKey>('bat_share')

  const points = useMemo<MarkerPoint[]>(() => {
    if (!hierarchy || !countries) return []

    if (drill.level === 'world') {
      return Object.entries(hierarchy.continents).map(([name, cont]) => {
        const allCountries = Object.values(cont.subregions).flatMap(s => Object.values(s.countries))
        const avg = allCountries.reduce((s, c) => s + (((c as any)[metric] as number) ?? 0), 0) / (allCountries.length || 1)
        const CONTINENT_CENTERS: Record<string, [number, number]> = {
          'América do Norte': [40, -100],
          'América Latina / Sul': [-15, -60],
          'Europa': [50, 15],
          'África': [5, 20],
          'Ásia': [35, 100],
          'Oceania': [-25, 135],
        }
        const [lat, lng] = CONTINENT_CENTERS[name] || [0, 0]
        return { lat, lng, label: name, value: avg, nextDrill: { level: 'continent' as const, continent: name } }
      })
    }

    if (drill.level === 'continent' && drill.continent) {
      const cont = hierarchy.continents[drill.continent]
      if (!cont) return []
      return Object.entries(cont.subregions).map(([name, sub]) => {
        const allC = Object.values(sub.countries)
        const avg = allC.reduce((s, c) => s + (((c as any)[metric] as number) ?? 0), 0) / (allC.length || 1)
        const SUBREGION_CENTERS: Record<string, [number, number]> = {
          'North America': [43, -90], 'Central America': [15, -90], 'Caribe': [18, -70],
          'South America': [-20, -58], 'Europe Ocidental': [50, 5], 'Europe Oriental': [55, 30],
          'Europe do Sul': [40, 16], 'Africa do Norte': [27, 20], 'Africa Ocidental': [8, 2],
          'Africa Oriental': [0, 38], 'Africa Central': [-2, 22], 'Africa do Sul/Austral': [-28, 28],
          'Africa Insular': [-20, 45], 'Asia do Sul': [25, 78], 'Asia Oriental': [36, 118],
          'Sudeste Asiático': [5, 112], 'Oriente Médio': [27, 45], 'Oceania': [-27, 135],
        }
        const [lat, lng] = SUBREGION_CENTERS[name] || [0, 0]
        return { lat, lng, label: name, value: avg, nextDrill: { level: 'subregion' as const, continent: drill.continent, subregion: name } }
      })
    }

    if (drill.level === 'subregion' && drill.continent && drill.subregion) {
      const sub = hierarchy.continents[drill.continent]?.subregions[drill.subregion]
      if (!sub) return []
      const COUNTRY_CENTERS: Record<string, [number, number]> = {
        Brazil: [-14.2, -51.9], Chile: [-35.6, -71.5], Argentina: [-38, -63],
        Colombia: [4, -72], Mexico: [23, -102], USA: [38, -97],
      }
      return Object.values(sub.countries).map(c => {
        const center = COUNTRY_CENTERS[c.country] || [0, 0]
        return {
          lat: center[0], lng: center[1],
          label: c.country,
          value: (c as any)[metric] as number | null,
          nextDrill: { level: 'country' as const, continent: drill.continent, subregion: drill.subregion, country: c.country }
        }
      })
    }

    if (drill.level === 'country' && drill.country) {
      const cd = countries[drill.country]
      if (!cd) return []
      return Object.values(cd.regions).map(r => ({
        lat: r.lat ?? 0,
        lng: r.lng ?? 0,
        label: r.region,
        value: (r as any)[metric] as number | null,
        sub: r.os_total ? `${r.os_total.toLocaleString()} OSs` : undefined,
        nextDrill: { level: 'region' as const, continent: drill.continent, subregion: drill.subregion, country: drill.country, region: r.region }
      })).filter(p => p.lat !== 0 || p.lng !== 0)
    }

    if (drill.level === 'region' && drill.country && drill.region) {
      const cd = countries[drill.country]
      const rd = cd?.regions[drill.region]
      if (!rd) return []
      return Object.values(rd.cities ?? {}).map(city => ({
        lat: city.lat, lng: city.lng,
        label: city.city,
        value: metric === 'productive_pct' ? city.productive_pct :
               metric === 'os_total' ? city.os_total : null,
        sub: `${city.os_total.toLocaleString()} OSs · ${city.productive_pct}% prod`,
      }))
    }

    return []
  }, [hierarchy, countries, drill, metric])

  const values = points.map(p => p.value ?? 0).filter(v => v > 0)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)

  function radius(v: number | null) {
    if (!v || maxV === minV) return 12
    return 8 + ((v - minV) / (maxV - minV)) * 24
  }

  function color(v: number | null) {
    if (!v || maxV === minV) return '#C9A84C'
    const t = (v - minV) / (maxV - minV)
    const r = Math.round(30 + t * 200)
    const g = Math.round(144 - t * 50)
    const b = Math.round(255 - t * 200)
    return `rgb(${r},${g},${b})`
  }

  if (hl || cl) return <Loading label="Carregando dados do mapa..." />

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-bat-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white">Mapa Global BAT</h1>
          <BreadCrumb drill={drill} onDrill={setDrill} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Métrica:</label>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as MetricKey)}
            className="bg-bat-card border border-bat-border rounded px-2 py-1 text-sm text-white"
          >
            {METRICS.map(m => (
              <option key={m} value={m}>{METRIC_LABELS[m]}</option>
            ))}
          </select>
          {drill.level !== 'world' && (
            <button
              onClick={() => setDrill({ level: 'world' })}
              className="px-3 py-1 text-xs bg-bat-blue rounded hover:bg-blue-700"
            >↩ Reset</button>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[10, 20]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />
          {points.map((p, i) => (
            p.lat !== 0 || p.lng !== 0 ? (
              <CircleMarker
                key={i}
                center={[p.lat, p.lng]}
                radius={radius(p.value)}
                pathOptions={{
                  fillColor: color(p.value),
                  fillOpacity: 0.85,
                  color: '#fff',
                  weight: 1,
                }}
                eventHandlers={{
                  click: () => p.nextDrill && setDrill(p.nextDrill),
                }}
              >
                <Tooltip>
                  <div className="text-xs">
                    <div className="font-bold">{p.label}</div>
                    <div>{METRIC_LABELS[metric]}: {
                      metric.includes('pct') || metric === 'bat_share'
                        ? fmtPct(p.value)
                        : fmtNumber(p.value)
                    }</div>
                    {p.sub && <div className="text-gray-300">{p.sub}</div>}
                    {p.nextDrill && <div className="text-blue-300 mt-1">Clique para detalhar</div>}
                  </div>
                </Tooltip>
              </CircleMarker>
            ) : null
          ))}
        </MapContainer>

        <div className="absolute bottom-4 left-4 bg-bat-card/90 rounded p-3 text-xs z-[1000]">
          <div className="font-medium mb-2 text-gray-300">Legenda — {METRIC_LABELS[metric]}</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color(minV) }} />
            <span className="text-gray-400">{metric.includes('pct') || metric === 'bat_share' ? fmtPct(minV) : fmtNumber(minV)}</span>
            <div className="w-12 h-2 rounded" style={{ background: 'linear-gradient(to right, rgb(30,144,255), rgb(230,94,55))' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: color(maxV) }} />
            <span className="text-gray-400">{metric.includes('pct') || metric === 'bat_share' ? fmtPct(maxV) : fmtNumber(maxV)}</span>
          </div>
          <div className="text-gray-500 mt-1">{points.length} pontos · Clique para drill-down</div>
        </div>
      </div>
    </div>
  )
}
