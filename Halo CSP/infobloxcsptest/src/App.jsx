import { useState } from 'react'
import TopBar       from './components/TopBar'
import Sidebar      from './components/Sidebar'
import MapView      from './components/MapView'
import DashboardPage from './components/DashboardPage'
import ChatPanel    from './components/ChatPanel'

const CONTENT_TABS = ['DNS', 'DHCP', 'IPAM', 'Halo AI']

export default function App() {
  const [chatOpen,    setChatOpen]    = useState(false)
  const [activePage,  setActivePage]  = useState('map')
  const [activeTab,   setActiveTab]   = useState('DNS')

  const pageTitle = activePage === 'dashboard'
    ? 'IQ: HALO AI Dashboard'
    : 'IQ: Operations'

  function handleTabClick(tab) {
    setActiveTab(tab)
    if (tab === 'Halo AI') {
      setChatOpen(o => !o)
    } else {
      setChatOpen(false)
    }
  }

  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="content">

          {/* Page header with inline tab bar */}
          <div className="page-header">
            <div className="page-header-top">
              <div>
                <div className="breadcrumb">
                  <span>IQ</span>
                  <span className="bc-sep">›</span>
                  <span className="bc-active">{pageTitle}</span>
                </div>
                <h1 className="page-title">{pageTitle}</h1>
              </div>

              {/* DNS / DHCP / IPAM / Halo AI tabs */}
              <div className="content-tabs">
                {CONTENT_TABS.map(tab => (
                  <button
                    key={tab}
                    className={[
                      'content-tab',
                      tab === 'Halo AI' ? 'content-tab--iq' : '',
                      (tab === activeTab && (tab !== 'Halo AI' || chatOpen)) ? 'content-tab--active' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleTabClick(tab)}
                  >
                    {tab === 'Halo AI' && <span className="tab-iq-spark">✦</span>}
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activePage === 'dashboard' ? <DashboardPage /> : <MapView />}
        </div>
      </div>

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(o => !o)} />
    </div>
  )
}
