import { useState, useMemo } from 'react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import { fmtNumber, fmtPct, METRIC_LABELS } from '../utils'
import type { MetricKey, CountryData } from '../types'

const COLS: { key: keyof CountryData | MetricKey; label: string }[] = [
  { key: 'country', label: 'País' },
  { key: 'continent', label: 'Continente' },
  { key: 'subregion', label: 'Sub-região' },
  { key: 'gdp', label: 'GDP' },
  { key: 'population', label: 'População' },
  { key: 'bat_share', label: 'BAT %' },
  { key: 'pos_total', label: 'PDVs Total' },
  { key: 'pos_bat', label: 'PDVs BAT' },
  { key: 'pos_active_pct', label: 'Ativos %' },
]

export default function CountriesPage() {
  const { data, loading } = useCountries()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('pos_bat')
  const [sortAsc, setSortAsc] = useState(false)
  const [continent, setContinent] = useState('')

  if (loading) return <Loading />
  if (!data) return null

  const continents = [...new Set(Object.values(data).map(c => c.continent))].sort()

  const rows = useMemo(() => {
    let list = Object.values(data)
    if (search) list = list.filter(c => c.country.toLowerCase().includes(search.toLowerCase()))
    if (continent) list = list.filter(c => c.continent === continent)
    list.sort((a, b) => {
      const va = (a as any)[sortKey] ?? (sortKey === 'country' ? '' : -Infinity)
      const vb = (b as any)[sortKey] ?? (sortKey === 'country' ? '' : -Infinity)
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortAsc ? va - vb : vb - va
    })
    return list
  }, [data, search, sortKey, sortAsc, continent])

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Países — {rows.length} de {Object.keys(data).length}</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país..."
            className="bg-bat-card border border-bat-border rounded px-3 py-1.5 text-sm text-white w-48"
          />
          <select
            value={continent}
            onChange={e => setContinent(e.target.value)}
            className="bg-bat-card border border-bat-border rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="">Todos os continentes</option>
            {continents.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-bat-card border border-bat-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-bat-border bg-black/20">
                {COLS.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 cursor-pointer hover:text-white whitespace-nowrap"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.country} className="border-b border-bat-border/30 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2 font-medium text-white">{c.country}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{c.continent}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{c.subregion}</td>
                  <td className="px-4 py-2 text-gray-300">${fmtNumber(c.gdp)}</td>
                  <td className="px-4 py-2 text-gray-300">{fmtNumber(c.population)}</td>
                  <td className="px-4 py-2 text-bat-gold font-medium">{fmtPct(c.bat_share)}</td>
                  <td className="px-4 py-2">{fmtNumber(c.pos_total)}</td>
                  <td className="px-4 py-2 text-blue-400">{fmtNumber(c.pos_bat)}</td>
                  <td className="px-4 py-2">
                    <span className={c.pos_active_pct && c.pos_active_pct > 20 ? 'text-green-400' : 'text-gray-400'}>
                      {fmtPct(c.pos_active_pct)}
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
