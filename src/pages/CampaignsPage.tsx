import ReactECharts from 'echarts-for-react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import { fmtNumber } from '../utils'

export default function CampaignsPage() {
  const { data, loading } = useCountries()
  if (loading) return <Loading />
  const brazil = data?.['Brazil']
  if (!brazil) return null

  const campaignTotals: Record<string, number> = {}
  const campaignByRegion: Record<string, Record<string, number>> = {}

  for (const region of Object.values(brazil.regions)) {
    for (const city of Object.values(region.cities ?? {})) {
      for (const [camp, cnt] of Object.entries(city.top_campaigns ?? {})) {
        campaignTotals[camp] = (campaignTotals[camp] ?? 0) + cnt
        if (!campaignByRegion[region.region]) campaignByRegion[region.region] = {}
        campaignByRegion[region.region][camp] = (campaignByRegion[region.region][camp] ?? 0) + cnt
      }
    }
  }

  const topCampaigns = Object.entries(campaignTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const pieOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${fmtNumber(p.value)} (${p.percent}%)` },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#9CA3AF', fontSize: 10 } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      data: topCampaigns.slice(0, 8).map(([name, value]) => ({ name, value })),
      label: { show: false },
      itemStyle: { borderColor: '#111827', borderWidth: 2 },
    }]
  }

  const barOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 20, bottom: 60, left: 200 },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF', formatter: (v: number) => fmtNumber(v) } },
    yAxis: { type: 'category', data: topCampaigns.map(([n]) => n), axisLabel: { color: '#9CA3AF', fontSize: 10 }, inverse: true },
    series: [{
      type: 'bar',
      data: topCampaigns.map(([, v]) => v),
      itemStyle: { color: '#C9A84C' },
      label: { show: true, position: 'right', color: '#9CA3AF', formatter: (p: any) => fmtNumber(p.value) }
    }]
  }

  const regions = Object.keys(campaignByRegion)
  const heatData: number[][] = []
  topCampaigns.slice(0, 10).forEach(([camp], ci) => {
    regions.forEach((reg, ri) => {
      heatData.push([ri, ci, campaignByRegion[reg][camp] ?? 0])
    })
  })

  const heatOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (p: any) => `${regions[p.value[0]]} × ${topCampaigns[p.value[1]]?.[0]}: ${fmtNumber(p.value[2])}`
    },
    grid: { top: 20, right: 20, bottom: 80, left: 60 },
    xAxis: { type: 'category', data: regions, axisLabel: { color: '#9CA3AF', fontSize: 10 } },
    yAxis: { type: 'category', data: topCampaigns.slice(0, 10).map(([n]) => n), axisLabel: { color: '#9CA3AF', fontSize: 9 } },
    visualMap: {
      min: 0,
      max: Math.max(...heatData.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      inRange: { color: ['#111827', '#003087', '#C9A84C'] },
      textStyle: { color: '#9CA3AF' }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: { show: false },
    }]
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Campanhas — Brasil</h1>
      <p className="text-sm text-gray-400">{Object.keys(campaignTotals).length} campanhas únicas identificadas nas Ordens de Serviço</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Top 15 Campanhas — Volume de OSs</h2>
          <ReactECharts option={barOpt} style={{ height: 400 }} />
        </div>
        <div className="bg-bat-card border border-bat-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Distribuição Top 8 Campanhas</h2>
          <ReactECharts option={pieOpt} style={{ height: 400 }} />
        </div>
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Heatmap — Campanhas × Regiões</h2>
        <ReactECharts option={heatOpt} style={{ height: 300 }} />
      </div>
    </div>
  )
}
