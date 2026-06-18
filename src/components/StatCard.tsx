interface Props {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
}

export default function StatCard({ label, value, sub, color = 'text-white', icon, trend }: Props) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider leading-none">{label}</div>
        {icon && (
          <div className="text-gray-600 shrink-0">{icon}</div>
        )}
      </div>
      <div className={`text-2xl font-bold leading-none tracking-tight ${color}`}>{value}</div>
      <div className="flex items-center gap-2">
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
        {trend && (
          <div className={`ml-auto text-xs font-medium flex items-center gap-0.5 ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              {trend.value >= 0
                ? <path d="M8 3l4 5H4l4-5z"/>
                : <path d="M8 13l4-5H4l4 5z"/>
              }
            </svg>
            {Math.abs(trend.value).toFixed(1)}%
            {trend.label && <span className="text-gray-500 font-normal ml-0.5">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
