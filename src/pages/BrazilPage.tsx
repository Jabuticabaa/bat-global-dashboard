import ReactECharts from 'echarts-for-react'
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
  const totalOS = regions.reduce((s, r) => s + (r.os_total ?? 0), 0)
  const totalProd = regions.reduce((s, r) => s + (r.os_productive ?? 0), 0)
  const prodPct = totalOS ? totalProd / totalOS * 100 : 0

  const barRegOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['OSs Total', 'OSs Produtivas'], textStyle: { color: '#9CA3AF' } },
    grid: { top: 40, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: regions.map(r => r.region), axisLabel: { color: '#9CA3AF' } },
    yAxis: { axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    series: [
      { name: 'OSs Total', type: 'bar', data: regions.map(r => r.os_total ?? 0), itemStyle: { color: '#3B82F6' } },
      { name: 'OSs Produtivas', type: 'bar', data: regions.map(r => r.os_productive ?? 0), itemStyle: { color: '#10B981' } },
    ]
  }

  const prodGaugeOpt = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0, max: 100,
      splitNumber: 5,
      detail: { formatter: '{value}%', color: '#fff', fontSize: 20 },
      data: [{ value: parseFloat(prodPct.toFixed(1)), name: 'Produtividade' }],
      axisLine: { lineStyle: { width: 20, color: [[0.5,'#EF4444'],[0.75,'#F59E0B'],[1,'#10B981']] } },
      pointer: { itemStyle: { color: '#C9A84C' } },
      title: { color: '#9CA3AF' },
    }]
  }

  const radarOpt = {
    backgroundColor: 'transparent',
    radar: {
      indicator: regions.map(r => ({ name: r.region, max: Math.max(...regions.map(x => x.pos_bat ?? 0)) })),
      axisName: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#1F2937' } },
      splitArea: { areaStyle: { color: ['#111827','#1F2937'] } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: regions.map(r => r.pos_bat ?? 0),
        name: 'PDVs BAT',
        areaStyle: { color: 'rgba(201,168,76,0.3)' },
        lineStyle: { color: '#C9A84C' },
        itemStyle: { color: '#C9A84C' },
      }]
    }]
  }

  const allCities = regions.flatMap(r => Object.values(r.cities ?? {}))
  const topCities = [...allCities].sort((a, b) => b.os_total - a.os_total).slice(0, 10)
  const cityBarOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 100, bottom: 40, left: 100 },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: { type: 'category', data: topCities.map(c => `${c.city}/${c.state}`), axisLabel: { color: '#9CA3AF', fontSize: 10 }, inverse: true },
    series: [
      {
        type: 'bar', name: 'OSs Total',
        data: topCities.map(c => c.os_total),
        itemStyle: { color: (p: any) => REGION_COLORS[topCities[p.dataIndex]?.region] ?? '#374151' },
        label: { show: true, position: 'right', color: '#9CA3AF', formatter: (p: any) => `${fmtNumber(p.value)} (${topCities[p.dataIndex]?.productive_pct}%)` }
      }
    ]
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Brasil — Operações BAT</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Ordens de Serviço" value={fmtNumber(totalOS)} sub="total processadas" color="text-bat-gold" />
        <StatCard label="Produtividade" value={fmtPct(prodPct)} sub="OSs produtivas" color="text-green-400" />
        <StatCard label="PDVs BAT" value={fmtNumber(brazil.pos_bat)} sub="pontos de venda" />
        <StatCard label="Market Share" value={fmtPct(brazil.bat_share)} sub="participação de mercado" color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">OSs por Região</h2>
          <ReactECharts option={barRegOpt} style={{ height: 260 }} />
        </div>
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Produtividade Geral</h2>
          <ReactECharts option={prodGaugeOpt} style={{ height: 260 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">PDVs BAT por Região (radar)</h2>
          <ReactECharts option={radarOpt} style={{ height: 280 }} />
        </div>
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Top 10 Cidades — OSs</h2>
          <ReactECharts option={cityBarOpt} style={{ height: 280 }} />
        </div>
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-bat-border">
          <h2 className="text-sm font-medium text-gray-300">Detalhe por Região</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-bat-border">
                <th className="px-4 py-2">Região</th>
                <th className="px-4 py-2">PDVs BAT</th>
                <th className="px-4 py-2">OSs Total</th>
                <th className="px-4 py-2">Produtividade</th>
                <th className="px-4 py-2">PDVs Ativos</th>
                <th className="px-4 py-2">Cidades</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.region} className="border-b border-bat-border/50 hover:bg-white/3">
                  <td className="px-4 py-2">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: REGION_COLORS[r.region] ?? '#374151' }} />
                    <span className="font-medium">{r.region}</span>
                  </td>
                  <td className="px-4 py-2">{fmtNumber(r.pos_bat)}</td>
                  <td className="px-4 py-2">{fmtNumber(r.os_total)}</td>
                  <td className="px-4 py-2">
                    <span className={r.productive_pct && r.productive_pct > 70 ? 'text-green-400' : r.productive_pct && r.productive_pct > 40 ? 'text-yellow-400' : 'text-red-400'}>
                      {fmtPct(r.productive_pct)}
                    </span>
                  </td>
                  <td className="px-4 py-2">{fmtPct(r.pos_active_pct)}</td>
                  <td className="px-4 py-2">{Object.keys(r.cities ?? {}).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
