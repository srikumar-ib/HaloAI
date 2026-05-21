import { useState } from 'react'

/* ── IQ sparkle icon — matches Infoblox IQ branding ── */
const IQIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L13.2 9 L19 7.5 L14.5 12 L19 16.5 L13.2 15 L12 21 L10.8 15 L5 16.5 L9.5 12 L5 7.5 L10.8 9 Z"
      fill="currentColor" opacity="0.9"/>
  </svg>
)

const navItems = [
  {
    id: 'iq',
    label: 'IQ',
    icon: <IQIcon />,
    subItems: [
      { id: 'halo-dashboard', label: 'HALO AI Dashboard', page: 'dashboard' }
    ]
  },
  {
    id: 'sase',
    label: 'Network',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    )
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    )
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    )
  },
  {
    id: 'system',
    label: 'System',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  }
]

export default function Sidebar({ activePage, onNavigate }) {
  const [expandedItem, setExpandedItem] = useState('iq')

  /* Determine which top-level item and sub-item are active */
  const activeTopId = activePage === 'dashboard' ? 'iq' : 'sase'
  const activeSubId = activePage === 'dashboard' ? 'halo-dashboard' : null
  const isExpanded  = expandedItem === 'iq'

  function handleTopClick(item) {
    if (item.subItems) {
      setExpandedItem(prev => (prev === item.id ? null : item.id))
    } else {
      setExpandedItem(null)
      if (item.id === 'sase') onNavigate('map')
    }
  }

  function handleSubClick(sub) {
    onNavigate(sub.page)
  }

  return (
    <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : ''}`}>
      {navItems.map(item => (
        <div key={item.id} className="sidebar-group">

          {/* Top-level item */}
          <button
            className={[
              'sidebar-item',
              activeTopId === item.id ? 'sidebar-item--active' : '',
              item.id === 'iq'        ? 'sidebar-item--iq'     : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleTopClick(item)}
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">
              {item.label}
              {item.subItems && (
                <span className={`sidebar-chevron ${expandedItem === item.id ? 'sidebar-chevron--open' : ''}`}>
                  ›
                </span>
              )}
            </span>
          </button>

          {/* Sub-items — only shown when expanded */}
          {item.subItems && expandedItem === item.id && (
            <div className="sidebar-subitems">
              {item.subItems.map(sub => (
                <button
                  key={sub.id}
                  className={`sidebar-subitem ${activeSubId === sub.id ? 'sidebar-subitem--active' : ''}`}
                  onClick={() => handleSubClick(sub)}
                  title={sub.label}
                >
                  <span className="sidebar-subitem-dot" />
                  <span className="sidebar-subitem-label">{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  )
}
