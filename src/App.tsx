import { useState } from 'react'
import Sidebar from './components/Sidebar'
import MapPage from './pages/MapPage'
import OverviewPage from './pages/OverviewPage'
import BrazilPage from './pages/BrazilPage'
import ChilePage from './pages/ChilePage'
import CountriesPage from './pages/CountriesPage'
import CampaignsPage from './pages/CampaignsPage'

export type Page = 'map' | 'overview' | 'brazil' | 'chile' | 'countries' | 'campaigns'

export default function App() {
  const [page, setPage] = useState<Page>('map')

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F1A]">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto min-w-0">
        {page === 'map'       && <MapPage />}
        {page === 'overview'  && <OverviewPage />}
        {page === 'brazil'    && <BrazilPage />}
        {page === 'chile'     && <ChilePage />}
        {page === 'countries' && <CountriesPage />}
        {page === 'campaigns' && <CampaignsPage />}
      </main>
    </div>
  )
}
