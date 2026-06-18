import ReactECharts from 'echarts-for-react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import { fmtNumber, fmtPct } from '../utils'

export default function OverviewPage() {
  const { data, loading } = useCountries()
  if (loading) return <Loading />
  if (!data) return <div className="p-8 text-red-400">Erro ao carregar dados</div>

  const countries = Object.values(data)
  const totalPOP = countries.reduce((s, c) => s + (c.population ?? 0), 0)
  const totalGDP = countries.reduce((s, c) => s + (c.gdp ?? 0), 0)
  const totalPOS = countries.reduce((s, c) => s + (c.pos_bat ?? 0), 0)
  const avgBAT  = countries.filter(c => c.bat_share).reduce((s, c) => s + (c.bat_share ?? 0), 0) / countries.filter(c => c.bat_share).length

  const byContinent: Record<string, { gdp: number; pos: number; countries: number }> = {}
  countries.forEach(c => {
    if (!byContinent[c.continent]) byContinent[c.continent] = { gdp: 0, pos: 0, countries: 0 }
    byContinent[c.continent].gdp += c.gdp ?? 0
    byContinent[c.continent].pos += c.pos_bat ?? 0
    byContinent[c.continent].countries++
  })

  const treemapData = Object.entries(byContinent).map(([name, d]) => ({
    name,
    value: d.pos,
    itemStyle: { color: ['#003087','#C9A84C','#1e40af','#92400e','#065f46','#4c1d95'][
      ['América do Norte','América Latina / Sul','Europa','África','Ásia','Oceania'].indexOf(name)
    ] ?? '#374151' }
  }))

  const barCountries = [...countries]
    .filter(c => c.pos_bat)
    .sort((a, b) => (b.pos_bat ?? 0) - (a.pos_bat ?? 0))
    .slice(0, 15)

  const barOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 20, bottom: 60, left: 90 },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: {
      type: 'category',
      data: barCountries.map(c => c.country),
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: barCountries.map(c => c.pos_bat),
      itemStyle: { color: '#C9A84C' },
      label: { show: true, position: 'right', color: '#9CA3AF', formatter: (p: any) => fmtNumber(p.value) }
    }]
  }

  const treemapOpt = {
    backgroundColor: 'transparent',
    tooltip: { formatter: (p: any) => `${p.name}: ${fmtNumber(p.value)} PDVs BAT` },
    series: [{
      type: 'treemap',
      data: treemapData,
      label: { show: true, color: '#fff', fontSize: 12 },
      breadcrumb: { show: false },
    }]
  }

  const bubbleOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (p: any) => {
        const [gdp, bat, pop, , name] = p.value
        return `<b>${name}</b><br>GDP: ${fmtNumber(gdp)}<br>BAT%: ${fmtPct(bat)}<br>Pop: ${fmtNumber(pop)}`
      }
    },
    grid: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: { name: 'GDP (USD)', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: { name: 'BAT Share %', axisLabel: { color: '#9CA3AF' } },
    series: [{
      type: 'scatter',
      data: countries
        .filter(c => c.gdp && c.bat_share)
        .map(c => [c.gdp, c.bat_share, c.population ?? 1000000, c.pos_bat ?? 0, c.country]),
      symbolSize: (d: number[]) => Math.max(6, Math.sqrt((d[2] ?? 1e6) / 1e6) * 3),
      itemStyle: { color: '#3B82F6', opacity: 0.7 },
    }]
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Visão Geral Global</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Países" value={countries.length.toString()} sub="142 mercados" />
        <StatCard label="PDVs BAT" value={fmtNumber(totalPOS)} sub="pontos de venda" color="text-bat-gold" />
        <StatCard label="Market Share médio" value={fmtPct(avgBAT)} sub="BAT global" color="text-blue-400" />
        <StatCard label="GDP Total" value={'$' + fmtNumber(totalGDP)} sub="mercados atendidos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Top 15 Países — PDVs BAT</h2>
          <ReactECharts option={barOpt} style={{ height: 360 }} />
        </div>
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">PDVs BAT por Continente</h2>
          <ReactECharts option={treemapOpt} style={{ height: 360 }} />
        </div>
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-300 mb-3">GDP vs Market Share BAT (bolha = população)</h2>
        <ReactECharts option={bubbleOpt} style={{ height: 300 }} />
      </div>
    </div>
  )
}
