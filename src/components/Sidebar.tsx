import type { Page } from '../App'
import clsx from 'clsx'

interface Props {
  current: Page
  onNavigate: (p: Page) => void
}

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'map',       label: 'Mapa Global',     icon: '🌍' },
  { id: 'overview',  label: 'Visão Geral',      icon: '📊' },
  { id: 'brazil',    label: 'Brasil',           icon: '🇧🇷' },
  { id: 'chile',     label: 'Chile',            icon: '🇨🇱' },
  { id: 'countries', label: 'Países',           icon: '📋' },
  { id: 'campaigns', label: 'Campanhas',        icon: '🎯' },
]

export default function Sidebar({ current, onNavigate }: Props) {
  return (
    <aside className="w-56 flex flex-col bg-bat-card border-r border-bat-border">
      <div className="p-4 border-b border-bat-border">
        <div className="text-bat-gold font-bold text-sm uppercase tracking-widest">BAT</div>
        <div className="text-xs text-gray-400 mt-0.5">Global Intelligence</div>
      </div>
      <nav className="flex-1 py-4">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left',
              current === item.id
                ? 'bg-bat-blue text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-bat-border text-xs text-gray-600 text-center">
        Dados 2024–2025
      </div>
    </aside>
  )
}
