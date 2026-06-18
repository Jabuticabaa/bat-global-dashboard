export default function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-bat-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}
