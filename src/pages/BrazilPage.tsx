import ReactECharts from 'echarts-for-react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import { fmtNumber, fmtPct } from '../utils'

const REGION_COLORS: Record<string, string> = {
  NNE: '#3B82F6', CTO: '#10B981', RIO: '#F59E0B',
  SPC: '#EF4444', SPR: '#8B5CF6', SUL: '#EC4899',
}

export default function BrazilPage() {
  const { data, loading } = useCountries()
  if (loading) return <Loading />
  const brazil = data?.['Brazil']
  if (!brazil) return <div className="p-8 text-gray-400">Dados do Brasil não encontrados</div>

  const regions = Object.values(brazil.regions)
  const totalOS   = regions.reduce((s, r) => s + (r.os_total ?? 0), 0)
  const totalProd = regions.reduce((s, r) => s + (r.os_productive ?? 0), 0)
  const prodPct   = totalOS ? totalProd / totalOS * 100 : 0

  const allCities = regions.flatMap(r => Object.values(r.cities ?? {}))
  const topCities = [...allCities].sort((a, b) => b.os_total - a.os_total).slice(0, 10)

  const barRegOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
    },
    legend: { data: ['OSs Total', 'OSs Produtivas'], textStyle: { color: '#9CA3AF', fontSize: 11 }, top: 0 },
    grid: { top: 36, right: 20, bottom: 32, left: 50 },
    xAxis: { type: 'category', data: regions.map(r => r.region), axisLabel: { color: '#9CA3AF' }, axisLine: { lineStyle: { color: '#1F2937' } }, axisTick: { show: false } },
    yAxis: { axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => fmtNumber(v) }, splitLine: { lineStyle: { color: '#1F2937' } } },
    series: [
      { name: 'OSs Total', type: 'bar', data: regions.map(r => r.os_total ?? 0), itemStyle: { color: '#3B82F6', borderRadius: [3,3,0,0] }, barMaxWidth: 28 },
      { name: 'OSs Produtivas', type: 'bar', data: regions.map(r => r.os_productive ?? 0), itemStyle: { color: '#10B981', borderRadius: [3,3,0,0] }, barMaxWidth: 28 },
    ]
  }

  const prodGaugeOpt = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200, endAngle: -20,
      min: 0, max: 100,
      splitNumber: 4,
      radius: '80%',
      detail: {
        formatter: (v: number) => v.toFixed(1) + '%',
        color: '#fff', fontSize: 22, fontWeight: 'bold',
        offsetCenter: [0, '30%']
      },
      data: [{ value: parseFloat(prodPct.toFixed(1)), name: 'Produtividade' }],
      axisLine: { lineStyle: { width: 16, color: [[0.5, '#EF4444'], [0.75, '#F59E0B'], [1, '#10B981']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { itemStyle: { color: '#C9A84C' }, length: '55%', width: 5 },
      title: { color: '#9CA3AF', fontSize: 12, offsetCenter: [0, '55%'] },
    }]
  }

  const radarMax = Math.max(...regions.map(r => r.pos_bat ?? 0)) * 1.1
  const radarOpt = {
    backgroundColor: 'transparent',
    radar: {
      indicator: regions.map(r => ({ name: r.region, max: radarMax })),
      axisName: { color: '#9CA3AF', fontSize: 12 },
      splitLine: { lineStyle: { color: '#1F2937' } },
      splitArea: { areaStyle: { color: ['#0d1117', '#111827'] } },
      center: ['50%', '50%'],
      radius: '65%',
    },
    tooltip: {
      backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
    },
    series: [{
      type: 'radar',
      data: [{
        value: regions.map(r => r.pos_bat ?? 0),
        name: 'PDVs BAT',
        areaStyle: { color: 'rgba(201,168,76,0.25)' },
        lineStyle: { color: '#C9A84C', width: 2 },
        itemStyle: { color: '#C9A84C' },
      }]
    }]
  }

  const cityBarOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
    },
    grid: { top: 10, right: 120, bottom: 8, left: 110 },
    xAxis: { type: 'value', axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => fmtNumber(v) }, splitLine: { lineStyle: { color: '#1F2937' } } },
    yAxis: { type: 'category', data: topCities.map(c => `${c.city}/${c.state}`), axisLabel: { color: '#9CA3AF', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, inverse: true },
    series: [{
      type: 'bar',
      data: topCities.map(c => ({
        value: c.os_total,
        itemStyle: { color: REGION_COLORS[c.region] ?? '#374151', borderRadius: [0, 3, 3, 0] }
      })),
      barMaxWidth: 16,
      label: { show: true, position: 'right', color: '#6B7280', fontSize: 10, formatter: (p: any) => `${fmtNumber(p.value)} · ${topCities[p.dataIndex]?.productive_pct}%` }
    }]
  }

  // Cities with geo for mini-map
  const citiesWithGeo = allCities.filter(c => c.lat && c.lng)
  const maxCityOS = Math.max(...citiesWithGeo.map(c => c.os_total))

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Brasil — Operações BAT</h1>
        <p className="text-sm text-gray-500 mt-0.5">{regions.length} regiões · {allCities.length} cidades · {totalOS.toLocaleString()} OSs processadas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ordens de Serviço"
          value={fmtNumber(totalOS)}
          sub="total processadas"
          color="text-[#C9A84C]"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd"/></svg>}
        />
        <StatCard
          label="Produtividade"
          value={fmtPct(prodPct)}
          sub={`${fmtNumber(totalProd)} produtivas`}
          color={prodPct > 70 ? 'text-emerald-400' : prodPct > 40 ? 'text-yellow-400' : 'text-red-400'}
          trend={{ value: prodPct - 70, label: 'vs meta' }}
        />
        <StatCard
          label="PDVs BAT"
          value={fmtNumber(brazil.pos_bat)}
          sub="pontos de venda"
          color="text-blue-400"
        />
        <StatCard
          label="Market Share"
          value={fmtPct(brazil.bat_share)}
          sub="participação de mercado"
          color="text-[#C9A84C]"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">OSs por Região</h2>
          <ReactECharts option={barRegOpt} style={{ height: 240 }} />
        </div>
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Produtividade Geral</h2>
          <ReactECharts option={prodGaugeOpt} style={{ height: 240 }} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">PDVs BAT por Região</h2>
          <ReactECharts option={radarOpt} style={{ height: 270 }} />
        </div>
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Top 10 Cidades — OSs</h2>
          <ReactECharts option={cityBarOpt} style={{ height: 270 }} />
        </div>
      </div>

      {/* Mini Map */}
      {citiesWithGeo.length > 0 && (
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Mapa de Cidades — Volume de OSs</h2>
          <div className="rounded-lg overflow-hidden" style={{ height: 320 }}>
            <MapContainer
              center={[-14.2, -51.9]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {citiesWithGeo.map(city => {
                const col = REGION_COLORS[city.region] ?? '#C9A84C'
                const r = 5 + (city.os_total / maxCityOS) * 25
                return (
                  <CircleMarker
                    key={`${city.city}/${city.state}`}
                    center={[city.lat, city.lng]}
                    radius={r}
                    pathOptions={{ fillColor: col, fillOpacity: 0.8, color: '#fff', weight: 1 }}
                  >
                    <Tooltip>
                      <div className="text-xs">
                        <div className="font-bold">{city.city}/{city.state}</div>
                        <div className="text-gray-300">{city.region} · {fmtNumber(city.os_total)} OSs</div>
                        <div className="text-gray-400">{city.productive_pct}% produtivas</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Region table */}
      <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937]">
          <h2 className="text-sm font-semibold text-gray-200">Detalhe por Região</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-[#1F2937] bg-[#0D1117]">
                <th className="px-5 py-3">Região</th>
                <th className="px-5 py-3">PDVs BAT</th>
                <th className="px-5 py-3">Market Share</th>
                <th className="px-5 py-3">OSs Total</th>
                <th className="px-5 py-3">Produtividade</th>
                <th className="px-5 py-3">PDVs Ativos</th>
                <th className="px-5 py-3">Cidades</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.region} className="border-b border-[#1F2937]/50 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: REGION_COLORS[r.region] ?? '#374151' }} />
                      <span className="font-semibold text-white">{r.region}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-blue-400 font-medium">{fmtNumber(r.pos_bat)}</td>
                  <td className="px-5 py-3 text-[#C9A84C] font-medium">{fmtPct(r.bat_share)}</td>
                  <td className="px-5 py-3 text-gray-300">{fmtNumber(r.os_total)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1F2937] max-w-[60px]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, r.productive_pct ?? 0)}%`,
                            background: (r.productive_pct ?? 0) > 70 ? '#10B981' : (r.productive_pct ?? 0) > 40 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>
                      <span className={
                        (r.productive_pct ?? 0) > 70 ? 'text-emerald-400' :
                        (r.productive_pct ?? 0) > 40 ? 'text-yellow-400' : 'text-red-400'
                      }>{fmtPct(r.productive_pct)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{fmtPct(r.pos_active_pct)}</td>
                  <td className="px-5 py-3 text-gray-400">{Object.keys(r.cities ?? {}).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
