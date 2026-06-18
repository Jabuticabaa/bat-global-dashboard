import ReactECharts from 'echarts-for-react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import StatCard from '../components/StatCard'
import { fmtNumber, fmtPct } from '../utils'

export default function ChilePage() {
  const { data, loading } = useCountries()
  if (loading) return <Loading />
  const chile = data?.['Chile']
  if (!chile) return <div className="p-8 text-gray-400">Dados do Chile não encontrados</div>

  const regions = Object.values(chile.regions).sort((a, b) => (b.pos_bat ?? 0) - (a.pos_bat ?? 0))

  const barOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 120, bottom: 40, left: 120 },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: { type: 'category', data: regions.map(r => r.region), axisLabel: { color: '#9CA3AF', fontSize: 10 }, inverse: true },
    series: [
      {
        type: 'bar', name: 'PDVs BAT', data: regions.map(r => r.pos_bat ?? 0),
        itemStyle: { color: '#C9A84C' },
        label: { show: true, position: 'right', color: '#9CA3AF', formatter: (p: any) => fmtNumber(p.value) }
      }
    ]
  }

  const activePct = regions.map(r => ({
    name: r.region,
    value: r.pos_active_pct ?? 0
  })).sort((a, b) => b.value - a.value)

  const activeBarOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 80, bottom: 60, left: 30 },
    xAxis: { type: 'category', data: activePct.map(r => r.name), axisLabel: { color: '#9CA3AF', rotate: 30, fontSize: 9 } },
    yAxis: { axisLabel: { color: '#9CA3AF', formatter: (v: number) => v + '%' } },
    series: [{
      type: 'bar',
      data: activePct.map(r => r.value),
      itemStyle: { color: (p: any) => {
        const v = activePct[p.dataIndex].value
        return v > 50 ? '#10B981' : v > 30 ? '#F59E0B' : '#EF4444'
      }},
      label: { show: true, position: 'top', color: '#9CA3AF', fontSize: 9, formatter: (p: any) => p.value.toFixed(0) + '%' }
    }]
  }

  const scatterOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (p: any) => {
        const r = regions.find(x => x.region === p.data[3])
        return `<b>${p.data[3]}</b><br>Pop: ${fmtNumber(p.data[0])}<br>PDVs BAT: ${fmtNumber(p.data[1])}<br>Ativos: ${fmtPct(p.data[2])}`
      }
    },
    grid: { top: 20, right: 20, bottom: 40, left: 70 },
    xAxis: { name: 'População', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: { name: 'PDVs BAT', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    series: [{
      type: 'scatter',
      data: regions.map(r => [r.population ?? 0, r.pos_bat ?? 0, r.pos_active_pct ?? 0, r.region]),
      symbolSize: 12,
      itemStyle: { color: '#3B82F6', opacity: 0.8 },
      label: { show: true, formatter: (p: any) => p.data[3], color: '#9CA3AF', fontSize: 9, position: 'top' }
    }]
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Chile — Inteligência de Mercado</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Regiões" value={regions.length.toString()} sub="operações ativas" />
        <StatCard label="PDVs BAT" value={fmtNumber(chile.pos_bat)} color="text-bat-gold" />
        <StatCard label="Market Share" value={fmtPct(chile.bat_share)} sub="mercado nacional" color="text-blue-400" />
        <StatCard label="GDP" value={'$' + fmtNumber(chile.gdp)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">PDVs BAT por Região</h2>
          <ReactECharts option={barOpt} style={{ height: 400 }} />
        </div>
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">% PDVs Ativos por Região</h2>
          <ReactECharts option={activeBarOpt} style={{ height: 400 }} />
        </div>
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-300 mb-3">População vs PDVs BAT por Região</h2>
        <ReactECharts option={scatterOpt} style={{ height: 300 }} />
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-bat-border">
          <h2 className="text-sm font-medium text-gray-300">Tabela de Regiões</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-bat-border">
                <th className="px-4 py-2">Região</th>
                <th className="px-4 py-2">GDP</th>
                <th className="px-4 py-2">População</th>
                <th className="px-4 py-2">PDVs Total</th>
                <th className="px-4 py-2">PDVs BAT</th>
                <th className="px-4 py-2">Ativos %</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.region} className="border-b border-bat-border/50 hover:bg-white/3">
                  <td className="px-4 py-2 font-medium">{r.region}</td>
                  <td className="px-4 py-2 text-gray-400">${fmtNumber(r.gdp)}</td>
                  <td className="px-4 py-2 text-gray-400">{fmtNumber(r.population)}</td>
                  <td className="px-4 py-2">{fmtNumber(r.pos_total)}</td>
                  <td className="px-4 py-2 text-bat-gold">{fmtNumber(r.pos_bat)}</td>
                  <td className="px-4 py-2">
                    <span className={r.pos_active_pct && r.pos_active_pct > 50 ? 'text-green-400' : r.pos_active_pct && r.pos_active_pct > 25 ? 'text-yellow-400' : 'text-red-400'}>
                      {fmtPct(r.pos_active_pct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
