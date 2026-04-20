import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { devices, statusTotals } from '../data/devices'

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

function deviceIcon(status) {
  const c = STATUS_COLOR[status] ?? '#8b949e'
  return L.divIcon({
    html: `<div class="device-marker" style="background:${c};box-shadow:0 0 0 3px ${c}33"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

function DeviceLayer() {
  const map = useMap()

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 55,
      iconCreateFunction: cluster => clusterIcon(cluster.getChildCount())
    })

    devices.forEach(device => {
      const marker = L.marker([device.lat, device.lng], { icon: deviceIcon(device.status) })
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
      )
      group.addLayer(marker)
    })

    map.addLayer(group)
    return () => map.removeLayer(group)
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
        <DeviceLayer />
      </MapContainer>
      <StatsBar />
    </div>
  )
}
