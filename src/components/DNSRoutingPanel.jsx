import { useState } from 'react'

const NIOSXAAS_INSTANCES = [
  { id: 'nxaas-use1', label: 'NIOSXaaS-US-East (AWS us-east-1)' },
  { id: 'nxaas-euw1', label: 'NIOSXaaS-EU-West (AWS eu-west-1)' },
  { id: 'nxaas-apse1', label: 'NIOSXaaS-APAC (AWS ap-southeast-1)' },
  { id: 'nxaas-mes1', label: 'NIOSXaaS-MEA (AWS me-south-1)' },
  { id: 'nxaas-sae1', label: 'NIOSXaaS-LatAm (AWS sa-east-1)' },
]

const NIOSX_SERVERS = [
  { id: 'niosx-ny01',  label: 'NIOSX-NY-01 (New York Hub)' },
  { id: 'niosx-lon01', label: 'NIOSX-LON-01 (London Hub)' },
  { id: 'niosx-dxb01', label: 'NIOSX-DXB-01 (Dubai Hub)' },
  { id: 'niosx-mum01', label: 'NIOSX-MUM-01 (Mumbai Hub)' },
  { id: 'niosx-sin01', label: 'NIOSX-SIN-01 (Singapore Hub)' },
  { id: 'niosx-fra01', label: 'NIOSX-FRA-01 (Frankfurt Hub)' },
]

const FALLBACK_OPTIONS = [
  { id: 'ms-dns',      label: 'Microsoft DNS/DHCP' },
  { id: 'sdwan-dhcp',  label: 'SDWAN Branch Router DHCP' },
  { id: 'nios-onprem', label: 'Infoblox NIOS (On Prem)' },
]

const EMPTY_SERVER = { type: '', instanceId: '' }

export default function DNSRoutingPanel({ isOpen, onClose, selectedSites }) {
  const [servers,  setServers]  = useState([{ ...EMPTY_SERVER }, { ...EMPTY_SERVER }])
  const [fallback, setFallback] = useState('')
  const [applied,  setApplied]  = useState(false)

  function setServerField(idx, field, value) {
    setApplied(false)
    setServers(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, [field]: value } : s)
      if (field === 'type') next[idx].instanceId = ''
      return next
    })
  }

  function getInstanceList(type) {
    return type === 'niosxaas' ? NIOSXAAS_INSTANCES : type === 'niosx' ? NIOSX_SERVERS : []
  }

  function getLabel(server) {
    if (!server.type || !server.instanceId) return null
    const list = getInstanceList(server.type)
    return list.find(i => i.id === server.instanceId)?.label ?? null
  }

  const fallbackLabel = FALLBACK_OPTIONS.find(f => f.id === fallback)?.label ?? null

  const canApply = servers.some(s => s.type && s.instanceId) && !!fallback

  function handleApply() {
    setApplied(true)
  }

  return (
    <>
      {isOpen && <div className="dns-panel-overlay" onClick={onClose} />}
      <div className={`dns-panel ${isOpen ? 'dns-panel--open' : ''}`}>

        {/* Header */}
        <div className="dns-panel-header">
          <div className="dns-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Configure DNS &amp; DHCP Routing
          </div>
          <button className="dns-panel-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Selected sites */}
        <div className="dns-section">
          <div className="dns-section-label">Applying to {selectedSites.length} Site{selectedSites.length !== 1 ? 's' : ''}</div>
          <div className="dns-sites-list">
            {selectedSites.map(site => (
              <span key={site.id} className="dns-site-chip">{site.name}</span>
            ))}
          </div>
        </div>

        <div className="dns-divider" />

        {/* Primary routing servers */}
        <div className="dns-section">
          <div className="dns-section-label">Choose Primary Routing Mode <span className="dns-hint">(select up to 2)</span></div>

          {servers.map((server, idx) => (
            <div key={idx} className="dns-server-row">
              <div className="dns-server-num">{idx + 1}</div>
              <div className="dns-server-fields">
                <div className="dns-type-toggle">
                  {[['niosxaas', 'NIOSXaaS'], ['niosx', 'NIOSX']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`dns-type-btn ${server.type === val ? 'dns-type-btn--active' : ''}`}
                      onClick={() => setServerField(idx, 'type', server.type === val ? '' : val)}
                    >{label}</button>
                  ))}
                </div>
                {server.type && (
                  <select
                    className="dns-select"
                    value={server.instanceId}
                    onChange={e => setServerField(idx, 'instanceId', e.target.value)}
                  >
                    <option value="">— Select {server.type === 'niosxaas' ? 'NIOSXaaS instance' : 'NIOSX server'} —</option>
                    {getInstanceList(server.type).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="dns-divider" />

        {/* Fallback */}
        <div className="dns-section">
          <div className="dns-section-label">Fallback for DDI Service <span className="dns-hint">(select 1)</span></div>
          <div className="dns-fallback-list">
            {FALLBACK_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`dns-fallback-btn ${fallback === opt.id ? 'dns-fallback-btn--active' : ''}`}
                onClick={() => { setFallback(opt.id); setApplied(false) }}
              >
                <span className={`dns-radio ${fallback === opt.id ? 'dns-radio--on' : ''}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dns-divider" />

        {/* Selected servers summary */}
        <div className="dns-section">
          <div className="dns-section-label">Selected Servers</div>
          <div className="dns-summary">
            {servers.map((s, idx) => (
              <div key={idx} className={`dns-summary-row ${getLabel(s) ? 'dns-summary-row--set' : 'dns-summary-row--empty'}`}>
                <span className="dns-summary-key">Primary {idx + 1}</span>
                <span className="dns-summary-val">{getLabel(s) ?? '—'}</span>
              </div>
            ))}
            <div className={`dns-summary-row ${fallbackLabel ? 'dns-summary-row--set' : 'dns-summary-row--empty'}`}>
              <span className="dns-summary-key">Fallback</span>
              <span className="dns-summary-val">{fallbackLabel ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dns-panel-footer">
          <button className="dns-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className={`dns-btn-apply ${applied ? 'dns-btn-apply--done' : ''}`}
            disabled={!canApply}
            onClick={handleApply}
          >
            {applied
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Applied</>
              : 'Apply to Selected Sites'
            }
          </button>
        </div>

      </div>
    </>
  )
}
