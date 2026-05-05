import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { devices, statusTotals } from '../data/devices'
import DNSRoutingPanel from './DNSRoutingPanel'

const STATUS_COLOR = { online: '#2ecc71', offline: '#e74c3c', warning: '#f39c12' }

function clusterIcon(count) {
  const size = count > 50 ? 52 : count > 20 ? 44 : count > 10 ? 38 : 32
  return L.divIcon({
    html: `<div class="cluster-marker" style="width:${size}px;height:${size}px">
             <span class="cluster-count">${count}</span>
           </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

function deviceIcon(status, selected) {
  const c = STATUS_COLOR[status] ?? '#8b949e'
  return L.divIcon({
    html: selected
      ? `<div class="device-marker device-marker--selected" style="background:${c}"></div>`
      : `<div class="device-marker" style="background:${c};box-shadow:0 0 0 3px ${c}33"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

function DeviceLayer({ selectMode, selectedIds, onToggle }) {
  const map        = useMap()
  const stateRef   = useRef({ selectMode, selectedIds, onToggle })
  const markersRef = useRef({})

  useEffect(() => {
    stateRef.current = { selectMode, selectedIds, onToggle }
    // refresh marker icons when selection changes
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const device   = devices.find(d => d.id === id)
      const selected = selectedIds.has(id)
      marker.setIcon(deviceIcon(device.status, selected))
    })
  }, [selectMode, selectedIds, onToggle])

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 55,
      iconCreateFunction: cluster => clusterIcon(cluster.getChildCount())
    })

    devices.forEach(device => {
      const marker = L.marker([device.lat, device.lng], {
        icon: deviceIcon(device.status, false)
      })
      markersRef.current[device.id] = marker

      marker.on('click', () => {
        const { selectMode, onToggle } = stateRef.current
        if (selectMode) {
          onToggle(device)
        } else {
          marker.bindPopup(
            `<div class="device-popup">
              <div class="popup-name">${device.name}</div>
              <table class="popup-table">
                <tr><td>Type</td><td>${device.type}</td></tr>
                <tr><td>Location</td><td>${device.city}, ${device.country}</td></tr>
                <tr><td>Region</td><td>${device.region}</td></tr>
                <tr><td>Status</td><td><span class="status-badge status-${device.status}">${device.status.toUpperCase()}</span></td></tr>
                <tr><td>Bandwidth</td><td>${device.bandwidth}</td></tr>
                <tr><td>Uptime</td><td>${device.uptime}</td></tr>
              </table>
            </div>`,
            { maxWidth: 260, className: 'custom-popup' }
          ).openPopup()
        }
      })

      group.addLayer(marker)
    })

    map.addLayer(group)
    return () => { map.removeLayer(group); markersRef.current = {} }
  }, [map])

  return null
}

function StatsBar() {
  const regions = {}
  devices.forEach(d => { regions[d.region] = (regions[d.region] ?? 0) + 1 })

  return (
    <div className="stats-bar">
      <div className="stats-section">
        <span className="stats-dot" style={{ background: '#00AEEF' }}></span>
        <span>SmartBranches: <strong>{devices.length}</strong></span>
      </div>
      <div className="stats-divider" />
      <div className="stats-section">
        <span className="stats-dot" style={{ background: '#2ecc71' }}></span>
        <span>Online: <strong>{statusTotals.online}</strong></span>
      </div>
      {statusTotals.offline > 0 && (
        <div className="stats-section">
          <span className="stats-dot" style={{ background: '#e74c3c' }}></span>
          <span>Offline: <strong>{statusTotals.offline}</strong></span>
        </div>
      )}
      {statusTotals.warning > 0 && (
        <div className="stats-section">
          <span className="stats-dot" style={{ background: '#f39c12' }}></span>
          <span>Warning: <strong>{statusTotals.warning}</strong></span>
        </div>
      )}
      <div className="stats-divider" />
      {Object.entries(regions).sort((a, b) => b[1] - a[1]).map(([r, n]) => (
        <div key={r} className="stats-section stats-region">
          <span>{r}: <strong>{n}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function MapView() {
  const [selectMode,     setSelectMode]     = useState(false)
  const [selectedIds,    setSelectedIds]    = useState(new Set())
  const [selectedDevices, setSelectedDevices] = useState([])
  const [dnsOpen,        setDnsOpen]        = useState(false)

  function toggleDevice(device) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(device.id)) next.delete(device.id)
      else next.add(device.id)
      return next
    })
    setSelectedDevices(prev => {
      const exists = prev.find(d => d.id === device.id)
      return exists ? prev.filter(d => d.id !== device.id) : [...prev, device]
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
    setSelectedDevices([])
  }

  return (
    <div className="map-wrap">
      <MapContainer
        center={[20, 15]}
        zoom={3}
        minZoom={2}
        maxZoom={13}
        className="leaflet-map"
        zoomControl={true}
        worldCopyJump={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <DeviceLayer
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggle={toggleDevice}
        />
      </MapContainer>

      {/* Select Sites button */}
      {!selectMode && (
        <button className="select-sites-btn" onClick={() => setSelectMode(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Select Sites
        </button>
      )}

      {/* Selection action bar */}
      {selectMode && (
        <div className="selection-bar">
          <div className="selection-bar-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {selectedIds.size > 0
              ? <><strong>{selectedIds.size}</strong> site{selectedIds.size !== 1 ? 's' : ''} selected — click map markers to add/remove</>
              : 'Click branch markers on the map to select sites'
            }
          </div>
          <div className="selection-bar-actions">
            <button
              className="selection-configure-btn"
              disabled={selectedIds.size === 0}
              onClick={() => setDnsOpen(true)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Configure DNS &amp; DHCP Routing
            </button>
            <button className="selection-cancel-btn" onClick={exitSelectMode}>Cancel</button>
          </div>
        </div>
      )}

      <StatsBar />

      <DNSRoutingPanel
        isOpen={dnsOpen}
        onClose={() => setDnsOpen(false)}
        selectedSites={selectedDevices}
      />
    </div>
  )
}
