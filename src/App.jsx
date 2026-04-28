import { useState } from 'react'
import TopBar       from './components/TopBar'
import Sidebar      from './components/Sidebar'
import MapView      from './components/MapView'
import DashboardPage from './components/DashboardPage'
import ChatPanel    from './components/ChatPanel'

export default function App() {
  const [chatOpen,   setChatOpen]   = useState(false)
  const [activePage, setActivePage] = useState('map')

  const pageTitle = activePage === 'dashboard'
    ? 'AI Operations Dashboard'
    : 'SASE Control Center'

  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="content">
          <div className="page-header">
            <div className="breadcrumb">
              <span>Dashboard</span>
              <span className="bc-sep">›</span>
              <span className="bc-active">{pageTitle}</span>
            </div>
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          {activePage === 'dashboard' ? <DashboardPage /> : <MapView />}
        </div>
      </div>
      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(o => !o)} />
    </div>
  )
}
