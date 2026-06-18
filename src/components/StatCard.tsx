interface Props {
  label: string
  value: string
  sub?: string
  color?: string
}

export default function StatCard({ label, value, sub, color = 'text-white' }: Props) {
  return (
    <div className="bg-bat-card border border-bat-border rounded-lg p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}
