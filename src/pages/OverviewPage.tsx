import ReactECharts from 'echarts-for-react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import { fmtNumber, fmtPct } from '../utils'
import { CONTINENT_COLORS } from '../components/Sidebar'

const CONTINENT_ORDER = ['América do Norte', 'América Latina / Sul', 'Europa', 'África', 'Ásia', 'Oceania']

export default function OverviewPage() {
  const { data, loading } = useCountries()
  if (loading) return <Loading />
  if (!data) return <div className="p-8 text-red-400">Erro ao carregar dados</div>

  const countries = Object.values(data)
  const totalPOP   = countries.reduce((s, c) => s + (c.population ?? 0), 0)
  const totalGDP   = countries.reduce((s, c) => s + (c.gdp ?? 0), 0)
  const totalPOS   = countries.reduce((s, c) => s + (c.pos_bat ?? 0), 0)
  const withShare  = countries.filter(c => c.bat_share != null && c.bat_share > 0)
  const avgBAT     = withShare.reduce((s, c) => s + (c.bat_share ?? 0), 0) / (withShare.length || 1)

  // By continent stats
  const byCont: Record<string, { gdp: number; pos: number; countries: number; share: number; shareN: number }> = {}
  countries.forEach(c => {
    if (!byCont[c.continent]) byCont[c.continent] = { gdp: 0, pos: 0, countries: 0, share: 0, shareN: 0 }
    byCont[c.continent].gdp     += c.gdp ?? 0
    byCont[c.continent].pos     += c.pos_bat ?? 0
    byCont[c.continent].countries++
    if (c.bat_share) { byCont[c.continent].share += c.bat_share; byCont[c.continent].shareN++ }
  })

  const barCountries = [...countries]
    .filter(c => c.pos_bat)
    .sort((a, b) => (b.pos_bat ?? 0) - (a.pos_bat ?? 0))
    .slice(0, 15)

  const barOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2333',
      borderColor: '#1F2937',
      textStyle: { color: '#F3F4F6' },
      formatter: (p: any) => `<b style="color:#C9A84C">${p[0].name}</b><br/>PDVs BAT: <b>${fmtNumber(p[0].value)}</b>`
    },
    grid: { top: 10, right: 110, bottom: 8, left: 90 },
    xAxis: { type: 'value', axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => fmtNumber(v) }, splitLine: { lineStyle: { color: '#1F2937' } } },
    yAxis: {
      type: 'category',
      data: barCountries.map(c => c.country),
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: barCountries.map(c => ({
        value: c.pos_bat,
        itemStyle: { color: CONTINENT_COLORS[c.continent] ?? '#C9A84C', borderRadius: [0, 4, 4, 0] }
      })),
      barMaxWidth: 18,
      label: { show: true, position: 'right', color: '#6B7280', fontSize: 10, formatter: (p: any) => fmtNumber(p.value) }
    }]
  }

  const contPosData = CONTINENT_ORDER.filter(c => byCont[c]).map(c => ({
    name: c, value: byCont[c].pos, itemStyle: { color: CONTINENT_COLORS[c] ?? '#374151' }
  }))
  const treemapOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
      formatter: (p: any) => `<b style="color:#C9A84C">${p.name}</b><br/>PDVs BAT: <b>${fmtNumber(p.value)}</b>`
    },
    series: [{
      type: 'treemap',
      data: contPosData,
      label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' },
      upperLabel: { show: false },
      breadcrumb: { show: false },
      itemStyle: { gapWidth: 2, borderWidth: 0 },
      roam: false,
    }]
  }

  const bubbleOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
      formatter: (p: any) => {
        const [gdp, bat, pop, , name] = p.value
        return `<b style="color:#C9A84C">${name}</b><br>GDP: $${fmtNumber(gdp)}<br>BAT Share: ${fmtPct(bat)}<br>Pop: ${fmtNumber(pop)}`
      }
    },
    grid: { top: 24, right: 20, bottom: 36, left: 64 },
    xAxis: {
      name: 'GDP (USD)', nameTextStyle: { color: '#6B7280', fontSize: 10 },
      axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => '$' + fmtNumber(v) },
      splitLine: { lineStyle: { color: '#1F2937' } }
    },
    yAxis: {
      name: 'BAT Share %', nameTextStyle: { color: '#6B7280', fontSize: 10 },
      axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => v + '%' },
      splitLine: { lineStyle: { color: '#1F2937' } }
    },
    series: [{
      type: 'scatter',
      data: countries
        .filter(c => c.gdp && c.bat_share)
        .map(c => [c.gdp, c.bat_share, c.population ?? 1e6, c.pos_bat ?? 0, c.country, c.continent]),
      symbolSize: (d: number[]) => Math.max(5, Math.sqrt((d[2] ?? 1e6) / 1e6) * 2.5),
      itemStyle: { opacity: 0.75, color: (p: any) => CONTINENT_COLORS[p.data[5]] ?? '#3B82F6' },
    }]
  }

  // Continent comparison bar
  const contShareData = CONTINENT_ORDER.filter(c => byCont[c] && byCont[c].shareN > 0)
  const contShareOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1C2333', borderColor: '#1F2937', textStyle: { color: '#F3F4F6' },
      trigger: 'axis',
      formatter: (p: any) => `<b style="color:#C9A84C">${p[0].name}</b><br/>Market Share médio: <b>${fmtPct(p[0].value)}</b>`
    },
    grid: { top: 10, right: 20, bottom: 8, left: 140 },
    xAxis: { type: 'value', axisLabel: { color: '#6B7280', fontSize: 10, formatter: (v: number) => v + '%' }, splitLine: { lineStyle: { color: '#1F2937' } } },
    yAxis: {
      type: 'category',
      data: contShareData,
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: contShareData.map(c => ({
        value: parseFloat((byCont[c].share / byCont[c].shareN).toFixed(1)),
        itemStyle: { color: CONTINENT_COLORS[c] ?? '#374151', borderRadius: [0, 4, 4, 0] }
      })),
      barMaxWidth: 20,
      label: { show: true, position: 'right', color: '#6B7280', fontSize: 10, formatter: (p: any) => fmtPct(p.value) }
    }]
  }

  return (
    <div className="p-6 space-y-5 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Visão Geral Global</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dados de mercado 2024–2025 · {countries.length} países</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Países cobertos"
          value={countries.length.toString()}
          sub={`${Object.keys(byCont).length} continentes`}
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/></svg>}
        />
        <StatCard
          label="PDVs BAT Total"
          value={fmtNumber(totalPOS)}
          sub="pontos de venda"
          color="text-[#C9A84C]"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>}
        />
        <StatCard
          label="Market Share médio"
          value={fmtPct(avgBAT)}
          sub="BAT global"
          color="text-blue-400"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>}
        />
        <StatCard
          label="GDP Total dos Mercados"
          value={'$' + fmtNumber(totalGDP)}
          sub={`Pop: ${fmtNumber(totalPOP)}`}
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Top 15 Países — PDVs BAT</h2>
          <ReactECharts option={barOpt} style={{ height: 340 }} />
        </div>
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">PDVs BAT por Continente</h2>
          <ReactECharts option={treemapOpt} style={{ height: 340 }} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">GDP vs Market Share BAT <span className="text-xs text-gray-500 font-normal">(bolha = população)</span></h2>
          <ReactECharts option={bubbleOpt} style={{ height: 280 }} />
        </div>
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Market Share BAT por Continente</h2>
          <ReactECharts option={contShareOpt} style={{ height: 280 }} />
        </div>
      </div>

      {/* Continent cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CONTINENT_ORDER.filter(c => byCont[c]).map(cont => {
          const d = byCont[cont]
          const avgShare = d.shareN ? d.share / d.shareN : 0
          const color = CONTINENT_COLORS[cont] ?? '#374151'
          return (
            <div key={cont} className="rounded-xl border border-[#1F2937] bg-[#111827] p-4" style={{ borderTopColor: color, borderTopWidth: 2 }}>
              <div className="text-xs font-medium text-gray-400 mb-2 truncate" title={cont}>{cont}</div>
              <div className="text-lg font-bold" style={{ color }}>{fmtNumber(d.pos)}</div>
              <div className="text-[10px] text-gray-500 mt-1">PDVs BAT</div>
              <div className="text-xs text-gray-300 mt-2">{fmtPct(avgShare)} share</div>
              <div className="text-[10px] text-gray-600">{d.countries} países</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
