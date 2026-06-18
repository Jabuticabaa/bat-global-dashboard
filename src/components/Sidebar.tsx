import { useState } from 'react'
import type { Page } from '../App'
import clsx from 'clsx'

interface Props {
  current: Page
  onNavigate: (p: Page) => void
}

const NAV: { id: Page; label: string; icon: JSX.Element }[] = [
  {
    id: 'map', label: 'Mapa Global',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"/><path d="M9 4v13M15 7v13"/></svg>
  },
  {
    id: 'overview', label: 'Visão Geral',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  },
  {
    id: 'brazil', label: 'Brasil',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3C9 6 8 9 8 12s1 6 4 9M12 3c3 3 4 6 4 9s-1 6-4 9"/></svg>
  },
  {
    id: 'chile', label: 'Chile',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2C8.5 2 7 4 7 7c0 5 1 8 2 12h6c1-4 2-7 2-12 0-3-1.5-5-5-5z"/></svg>
  },
  {
    id: 'countries', label: 'Países',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
  },
  {
    id: 'campaigns', label: 'Campanhas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  },
]

const CONTINENT_COLORS: Record<string, string> = {
  'América do Norte': '#3B82F6',
  'América Latina / Sul': '#10B981',
  'Europa': '#8B5CF6',
  'África': '#F59E0B',
  'Ásia': '#EF4444',
  'Oceania': '#06B6D4',
}

export { CONTINENT_COLORS }

export default function Sidebar({ current, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'flex flex-col bg-[#0D1117] border-r border-[#1F2937] transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header */}
      <div className={clsx(
        'flex items-center border-b border-[#1F2937] h-14',
        collapsed ? 'justify-center px-0' : 'px-4 gap-3'
      )}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-[#C9A84C] font-bold text-sm tracking-widest uppercase">BAT</div>
            <div className="text-[10px] text-gray-500 tracking-wide">Global Intelligence</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV.map(item => {
          const active = current === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-left',
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5',
                active
                  ? 'bg-[#003087]/30 text-white border-l-2 border-[#C9A84C]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <span className={clsx('shrink-0', active ? 'text-[#C9A84C]' : '')}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#1F2937]">
          <div className="text-[10px] text-gray-600 leading-relaxed">
            Dados 2024–2025<br />
            <span className="text-[#C9A84C]/60">BAT Global</span>
          </div>
        </div>
      )}
    </aside>
  )
}
