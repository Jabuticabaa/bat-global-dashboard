import { useState, useMemo } from 'react'
import { useCountries } from '../hooks/useData'
import Loading from '../components/Loading'
import { fmtNumber, fmtPct } from '../utils'
import type { CountryData } from '../types'
import { CONTINENT_COLORS } from '../components/Sidebar'

const COLS: { key: keyof CountryData | string; label: string }[] = [
  { key: 'country',      label: 'País' },
  { key: 'continent',    label: 'Continente' },
  { key: 'gdp',          label: 'GDP' },
  { key: 'population',   label: 'População' },
  { key: 'bat_share',    label: 'BAT %' },
  { key: 'pos_total',    label: 'PDVs Total' },
  { key: 'pos_bat',      label: 'PDVs BAT' },
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
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Países</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} de {Object.keys(data).length} países</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar país..."
              className="bg-[#111827] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-sm text-white w-52 outline-none focus:border-[#C9A84C]/50 placeholder:text-gray-600"
            />
          </div>
          <select
            value={continent}
            onChange={e => setContinent(e.target.value)}
            className="bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-[#C9A84C]/50"
          >
            <option value="">Todos os continentes</option>
            {continents.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-[#1F2937] bg-[#0D1117]">
                {COLS.map(col => (
                  <th
                    key={col.key}
                    className="px-5 py-3 cursor-pointer hover:text-gray-300 whitespace-nowrap select-none transition-colors"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-[#C9A84C]">
                          {sortAsc ? <path d="M8 4l4 5H4l4-5z"/> : <path d="M8 12l4-5H4l4 5z"/>}
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => {
                const contColor = CONTINENT_COLORS[c.continent] ?? '#374151'
                return (
                  <tr key={c.country} className="border-b border-[#1F2937]/30 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-5 text-right">{i + 1}</span>
                        <span className="font-medium text-white">{c.country}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border"
                        style={{ color: contColor, borderColor: contColor + '40', background: contColor + '15' }}>
                        {c.continent}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-300">${fmtNumber(c.gdp)}</td>
                    <td className="px-5 py-2.5 text-gray-400">{fmtNumber(c.population)}</td>
                    <td className="px-5 py-2.5">
                      {c.bat_share != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-[#1F2937]">
                            <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${Math.min(100, c.bat_share)}%` }} />
                          </div>
                          <span className="text-[#C9A84C] font-medium">{fmtPct(c.bat_share)}</span>
                        </div>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-2.5 text-gray-400">{fmtNumber(c.pos_total)}</td>
                    <td className="px-5 py-2.5 text-blue-400 font-medium">{fmtNumber(c.pos_bat)}</td>
                    <td className="px-5 py-2.5">
                      <span className={c.pos_active_pct && c.pos_active_pct > 20 ? 'text-emerald-400' : 'text-gray-500'}>
                        {fmtPct(c.pos_active_pct)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
