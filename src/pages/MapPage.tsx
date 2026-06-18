import { useState, useMemo, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import type { MetricKey } from '../types'
import { METRIC_LABELS, fmtNumber, fmtPct } from '../utils'

// Country name mapping: our data names → GeoJSON feature names
const NAME_MAP: Record<string, string> = {
  // Americas
  'EUA': 'USA',
  'Canadá': 'Canada',
  'México': 'Mexico',
  'Colômbia': 'Colombia',
  'Equador': 'Ecuador',
  'Paraguai': 'Paraguay',
  'Uruguai': 'Uruguay',
  'Bolívia': 'Bolivia',
  'Venezuela': 'Venezuela',
  'Panamá': 'Panama',
  'Nicarágua': 'Nicaragua',
  'República Dominicana': 'Dominican Republic',
  'Trinidad e Tobago': 'Trinidad and Tobago',
  'Guiana': 'Guyana',
  'Suriname': 'Suriname',
  'Guatemala': 'Guatemala',
  'Honduras': 'Honduras',
  // Europe
  'Reino Unido': 'England',
  'Alemanha': 'Germany',
  'França': 'France',
  'Espanha': 'Spain',
  'Itália': 'Italy',
  'Holanda': 'Netherlands',
  'Bélgica': 'Belgium',
  'Suíça': 'Switzerland',
  'Áustria': 'Austria',
  'Suécia': 'Sweden',
  'Noruega': 'Norway',
  'Dinamarca': 'Denmark',
  'Finlândia': 'Finland',
  'Polônia': 'Poland',
  'Romênia': 'Romania',
  'Hungria': 'Hungary',
  'Bulgária': 'Bulgaria',
  'Sérvia': 'Republic of Serbia',
  'Croácia': 'Croatia',
  'Eslovênia': 'Slovenia',
  'Eslováquia': 'Slovakia',
  'República Tcheca': 'Czech Republic',
  'Lituânia': 'Lithuania',
  'Letônia': 'Latvia',
  'Estônia': 'Estonia',
  'Bielorrússia': 'Belarus',
  'Ucrânia': 'Ukraine',
  'Rússia': 'Russia',
  'Macedônia': 'Macedonia',
  'Albânia': 'Albania',
  'Grécia': 'Greece',
  'Portugal': 'Portugal',
  // Asia
  'Japão': 'Japan',
  'Coreia do Sul': 'South Korea',
  'China': 'China',
  'Indonésia': 'Indonesia',
  'Malásia': 'Malaysia',
  'Tailândia': 'Thailand',
  'Filipinas': 'Philippines',
  'Vietnã': 'Vietnam',
  'Camboja': 'Cambodia',
  'Myanmar': 'Myanmar',
  'Paquistão': 'Pakistan',
  'Austrália': 'Australia',
  'Nova Zelândia': 'New Zealand',
  'Cazaquistão': 'Kazakhstan',
  'Uzbequistão': 'Uzbekistan',
  'Azerbaijão': 'Azerbaijan',
  'Armênia': 'Armenia',
  'Geórgia': 'Georgia',
  'Chipre': 'Cyprus',
  // Middle East
  'Arábia Saudita': 'Saudi Arabia',
  'EAU': 'United Arab Emirates',
  'Iraque': 'Iraq',
  'Jordânia': 'Jordan',
  'Kuwait': 'Kuwait',
  'Líbano': 'Lebanon',
  'Omã': 'Oman',
  'Iêmen': 'Yemen',
  'Palestina': 'West Bank',
  // Africa
  'Africa do Sul': 'South Africa',
  'Nigéria': 'Nigeria',
  'Etiópia': 'Ethiopia',
  'Egito': 'Egypt',
  'Quênia': 'Kenya',
  'Tanzânia': 'United Republic of Tanzania',
  'Gana': 'Ghana',
  'Camarões': 'Cameroon',
  'Uganda': 'Uganda',
  'Zimbábue': 'Zimbabwe',
  'Zâmbia': 'Zambia',
  'Moçambique': 'Mozambique',
  'Marrocos': 'Morocco',
  'Argélia': 'Algeria',
  'Senegal': 'Senegal',
  'Mali': 'Mali',
  'Burkina Faso': 'Burkina Faso',
  'Níger': 'Niger',
  'Namíbia': 'Namibia',
  'Botswana': 'Botswana',
  'Ruanda': 'Rwanda',
  'Burundi': 'Burundi',
  'Benin': 'Benin',
  'Togo': 'Togo',
  'Gabão': 'Gabon',
  'Guiné': 'Guinea',
  'Guiné Equatorial': 'Equatorial Guinea',
  'Serra Leoa': 'Sierra Leone',
  'Costa do Marfim': 'Ivory Coast',
  'Mauritânia': 'Mauritania',
  'Gâmbia': 'Gambia',
  'Djibuti': 'Djibouti',
  'Eritreia': 'Eritrea',
  'Somália': 'Somalia',
  'Sudão': 'Sudan',
  'Sudão do Sul': 'South Sudan',
  'Líbia': 'Libya',
  'Tunísia': 'Tunisia',
  'Malaui': 'Malawi',
  'Angola': 'Angola',
  'RD Congo': 'Democratic Republic of the Congo',
  // Pacific/Other
  'Fiji': 'Fiji',
  'Ilhas Salomão': 'Solomon Islands',
  'Papua Nova Guiné': 'Papua New Guinea',
  'Sri Lanka': 'Sri Lanka',
  'Taiwan': 'Taiwan',
  'Kosovo': 'Kosovo',
  'Somaliland': 'Somaliland',
}

function toGeoName(name: string): string {
  return NAME_MAP[name] ?? name
}

const METRICS: MetricKey[] = ['bat_share', 'pos_bat', 'pos_active_pct', 'gdp', 'population']

const REGION_COLORS: Record<string, string> = {
  NNE: '#3B82F6', CTO: '#10B981', RIO: '#F59E0B',
  SPC: '#EF4444', SPR: '#8B5CF6', SUL: '#EC4899',
}

type ViewMode = 'world' | 'country-detail'

interface CountryDrill {
  country: string
  lat: number
  lng: number
}

export default function MapPage() {
  const { data: countries, loading } = useCountries()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [metric, setMetric] = useState<MetricKey>('bat_share')
  const [view, setView] = useState<ViewMode>('world')
  const [drillCountry, setDrillCountry] = useState<CountryDrill | null>(null)
  const [geoLoaded, setGeoLoaded] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)

  // Load world GeoJSON and register
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/world.geojson`)
      .then(r => r.json())
      .then(data => {
        echarts.registerMap('world', data)
        setGeoLoaded(true)
      })
      .catch(() => setGeoError('GeoJSON não encontrado em /data/world.geojson'))
  }, [])

  // Build series data
  const seriesData = useMemo(() => {
    if (!countries) return []
    return Object.values(countries).map(c => ({
      name: toGeoName(c.country),
      originalName: c.country,
      value: (c as any)[metric] as number | null ?? 0,
      bat_share: c.bat_share,
      pos_bat: c.pos_bat,
      continent: c.continent,
    }))
  }, [countries, metric])

  const maxVal = useMemo(() => {
    const vals = seriesData.map(d => d.value).filter(v => v > 0)
    return vals.length ? Math.max(...vals) : 1
  }, [seriesData])

  // Init / update ECharts
  useEffect(() => {
    if (!geoLoaded || !chartRef.current || !countries) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark')
    }

    const chart = chartInstance.current

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1C2333',
        borderColor: '#1F2937',
        textStyle: { color: '#F3F4F6', fontSize: 12 },
        formatter: (params: any) => {
          if (!params.data) return params.name
          const v = params.data.value
          const fmt = metric === 'bat_share' || metric === 'pos_active_pct'
            ? fmtPct(v) : fmtNumber(v)
          return `<b style="color:#C9A84C">${params.data.originalName || params.name}</b><br/>
                  <span style="color:#9CA3AF">${METRIC_LABELS[metric]}:</span> <b>${fmt}</b>`
        }
      },
      visualMap: {
        min: 0,
        max: maxVal,
        inRange: {
          color: ['#0d1b3e', '#003087', '#1a5fbd', '#C9A84C', '#FFD700']
        },
        textStyle: { color: '#6B7280', fontSize: 10 },
        left: 'left',
        bottom: 20,
        itemWidth: 12,
        itemHeight: 100,
        text: [String(metric === 'bat_share' ? maxVal.toFixed(1) + '%' : fmtNumber(maxVal)), '0'],
        calculable: false,
      },
      series: [{
        type: 'map',
        map: 'world',
        roam: true,
        zoom: 1.2,
        center: [10, 20],
        nameMap: {},
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: '#C9A84C33', borderColor: '#C9A84C', borderWidth: 1.5 }
        },
        select: { disabled: true },
        itemStyle: {
          borderColor: '#2D3748',
          borderWidth: 0.5,
          areaColor: '#131c2e',
        },
        data: seriesData,
        label: { show: false },
      }]
    }

    chart.setOption(option, true)

    chart.off('click')
    chart.on('click', (params: any) => {
      if (params.componentType !== 'series') return
      const originalName = params.data?.originalName ?? params.name
      if (!countries || !originalName) return
      // Find matching country
      const cd = countries[originalName]
      if (!cd || !Object.keys(cd.regions ?? {}).length) return
      // Country center coords from regions
      const regs = Object.values(cd.regions)
      const regsWithGeo = regs.filter(r => r.lat && r.lng)
      if (!regsWithGeo.length) return
      const avgLat = regsWithGeo.reduce((s, r) => s + (r.lat ?? 0), 0) / regsWithGeo.length
      const avgLng = regsWithGeo.reduce((s, r) => s + (r.lng ?? 0), 0) / regsWithGeo.length
      setDrillCountry({ country: originalName, lat: avgLat, lng: avgLng })
      setView('country-detail')
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [geoLoaded, seriesData, countries, metric, maxVal])

  // Cleanup
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  if (loading) return <Loading label="Carregando mapa..." />

  const drillData = drillCountry && countries ? countries[drillCountry.country] : null
  const drillRegions = drillData ? Object.values(drillData.regions) : []

  const regionVals = drillRegions.map(r => (r as any)[metric] as number ?? 0).filter(v => v > 0)
  const minRV = regionVals.length ? Math.min(...regionVals) : 0
  const maxRV = regionVals.length ? Math.max(...regionVals) : 1

  function regionRadius(v: number | null) {
    if (!v || maxRV === minRV) return 16
    return 10 + ((v - minRV) / (maxRV - minRV)) * 28
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0F1A]">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F2937] bg-[#0D1117]">
        <div className="flex items-center gap-3">
          {view === 'country-detail' && (
            <button
              onClick={() => { setView('world'); setDrillCountry(null) }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1C2333] border border-[#1F2937] rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M10 12L6 8l4-4"/>
              </svg>
              Voltar ao mapa
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white">
                {view === 'world' ? 'Mapa Global BAT' : `${drillCountry?.country} — Regiões`}
              </h1>
              <span className="text-[10px] font-medium bg-[#003087]/30 text-blue-300 border border-[#003087]/40 rounded-full px-2 py-0.5 uppercase tracking-wider">
                {view === 'world' ? '142 países' : `${drillRegions.length} regiões`}
              </span>
            </div>
            {view === 'world' && (
              <p className="text-xs text-gray-500 mt-0.5">Clique em um país com dados para ver regiões</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Métrica:</span>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as MetricKey)}
            className="bg-[#1C2333] border border-[#1F2937] rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-[#C9A84C]/50"
          >
            {METRICS.map(m => (
              <option key={m} value={m}>{METRIC_LABELS[m]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {geoError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-[#1C2333] border border-red-800 rounded-xl p-6 max-w-sm text-center">
              <div className="text-red-400 text-sm">{geoError}</div>
              <div className="text-gray-500 text-xs mt-2">Execute o ETL para baixar o arquivo GeoJSON</div>
            </div>
          </div>
        )}

        {/* World ECharts choropleth */}
        <div
          ref={chartRef}
          className="absolute inset-0"
          style={{ display: view === 'world' ? 'block' : 'none' }}
        />

        {/* Country drill-down with Leaflet */}
        {view === 'country-detail' && drillCountry && (
          <MapContainer
            key={drillCountry.country}
            center={[drillCountry.lat, drillCountry.lng]}
            zoom={drillCountry.country === 'Brazil' ? 4 : drillCountry.country === 'Chile' ? 5 : 5}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution=""
            />
            {drillRegions.map(r => {
              const v = (r as any)[metric] as number | null
              const rad = regionRadius(v)
              const col = REGION_COLORS[r.region] ?? '#C9A84C'
              const allCities = Object.values(r.cities ?? {})
              return (
                <CircleMarker
                  key={r.region}
                  center={[r.lat!, r.lng!]}
                  radius={rad}
                  pathOptions={{ fillColor: col, fillOpacity: 0.75, color: '#fff', weight: 1.5 }}
                >
                  <LTooltip>
                    <div className="text-xs min-w-[140px]">
                      <div className="font-bold text-sm mb-1">{r.region}</div>
                      <div className="text-gray-300">{METRIC_LABELS[metric]}: <b>{
                        metric === 'bat_share' || metric === 'pos_active_pct' ? fmtPct(v) : fmtNumber(v)
                      }</b></div>
                      {r.os_total ? <div className="text-gray-400 mt-0.5">{r.os_total.toLocaleString()} OSs · {r.productive_pct?.toFixed(1)}% prod</div> : null}
                      {allCities.length > 0 && <div className="text-blue-300 text-[10px] mt-1">{allCities.length} cidades</div>}
                    </div>
                  </LTooltip>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}

        {/* Legend overlay for world map */}
        {view === 'world' && !geoError && (
          <div className="absolute bottom-8 right-4 bg-[#111827]/90 backdrop-blur border border-[#1F2937] rounded-xl p-3 text-xs z-10">
            <div className="font-medium text-gray-300 mb-2">{METRIC_LABELS[metric]}</div>
            <div className="h-24 w-3 rounded-full mx-auto mb-1" style={{
              background: 'linear-gradient(to bottom, #FFD700, #C9A84C, #003087, #0d1b3e)'
            }} />
            <div className="text-center text-gray-500 text-[10px]">
              <div>{metric === 'bat_share' || metric === 'pos_active_pct' ? fmtPct(maxVal) : fmtNumber(maxVal)}</div>
              <div className="mt-14">0</div>
            </div>
          </div>
        )}

        {/* Region legend for drill-down */}
        {view === 'country-detail' && drillData && (
          <div className="absolute top-4 right-4 bg-[#111827]/90 backdrop-blur border border-[#1F2937] rounded-xl p-4 text-xs z-[1000] max-w-[200px]">
            <div className="font-medium text-gray-300 mb-2">{drillCountry?.country} — Regiões</div>
            {drillRegions.map(r => (
              <div key={r.region} className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: REGION_COLORS[r.region] ?? '#C9A84C' }} />
                  <span className="text-gray-400">{r.region}</span>
                </div>
                <span className="text-gray-200 font-medium">
                  {metric === 'bat_share' || metric === 'pos_active_pct'
                    ? fmtPct((r as any)[metric])
                    : fmtNumber((r as any)[metric])
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
