import { useState } from 'react'
import TopBar    from './components/TopBar'
import Sidebar   from './components/Sidebar'
import MapView   from './components/MapView'
import ChatPanel from './components/ChatPanel'

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <Sidebar />
        <div className="content">
          <div className="page-header">
            <div className="breadcrumb">
              <span>Dashboard</span>
              <span className="bc-sep">›</span>
              <span className="bc-active">SASE Control Center</span>
            </div>
            <h1 className="page-title">SASE Control Center</h1>
          </div>
          <MapView />
        </div>
      </div>
      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(o => !o)} />
    </div>
  )
}
