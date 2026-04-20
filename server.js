import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import { devices, regionSummary, statusTotals } from './src/data/devices.js'
import { ipsecTunnels, bgpSessions, ipsecSummary, bgpSummary } from './src/data/network.js'

const API_KEY  = process.env.ANTHROPIC_API_KEY
const MOCK_MODE = !API_KEY || process.env.MOCK_AI === 'true'

const app = express()
app.use(express.json())
app.use(cors())

const anthropic = MOCK_MODE ? null : new Anthropic({ apiKey: API_KEY })

const regionData = Object.fromEntries(
  Object.entries(regionSummary).map(([r, v]) => [r, { ...v, countries: [...v.countries] }])
)

// ── Mock responder (no API key needed) ────────────────────────────────────────
function mockReply(message) {
  const q = message.toLowerCase()

  // Region counts
  for (const [region, data] of Object.entries(regionData)) {
    const aliases = {
      'North America': ['north america', 'usa', 'us', 'united states', 'canada', 'america'],
      'Europe':        ['europe', 'european'],
      'Asia-Pacific':  ['asia', 'apac', 'asia-pacific', 'pacific', 'australia', 'japan', 'india'],
      'Middle East':   ['middle east', 'uae', 'dubai', 'saudi'],
      'Latin America': ['latin america', 'latam', 'south america', 'brazil', 'mexico'],
      'Africa':        ['africa', 'african'],
    }
    const terms = aliases[region] ?? [region.toLowerCase()]
    if (terms.some(t => q.includes(t))) {
      return `**${region}** has **${data.total} devices** — ${data.online} online, ${data.offline} offline, ${data.warning} warning.\n\nCountries: ${data.countries.join(', ')}.`
    }
  }

  // Offline devices
  if (q.includes('offline') || q.includes('down')) {
    const offline = devices.filter(d => d.status === 'offline')
    if (!offline.length) return 'No devices are currently offline. ✓'
    return `**${offline.length} device(s) offline:**\n${offline.map(d => `• ${d.name} — ${d.city}, ${d.country}`).join('\n')}`
  }

  // Warning devices
  if (q.includes('warn') || q.includes('issue') || q.includes('problem')) {
    const warn = devices.filter(d => d.status === 'warning')
    if (!warn.length) return 'No devices have warnings. ✓'
    return `**${warn.length} device(s) with warnings:**\n${warn.map(d => `• ${d.name} — ${d.city}, ${d.country} (uptime: ${d.uptime})`).join('\n')}`
  }

  // Total / summary
  if (q.includes('total') || q.includes('how many') || q.includes('count') || q.includes('summar')) {
    const lines = Object.entries(regionData)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([r, d]) => `• ${r}: ${d.total} (${d.online} online)`)
    return `**Total: ${devices.length} devices** across 6 regions.\n${statusTotals.online} online · ${statusTotals.offline} offline · ${statusTotals.warning} warning\n\n**By region:**\n${lines.join('\n')}`
  }

  // Hub devices
  if (q.includes('hub')) {
    const hubs = devices.filter(d => d.type === 'Hub')
    return `**${hubs.length} Hub devices:**\n${hubs.map(d => `• ${d.name} — ${d.city}, ${d.country} (${d.bandwidth})`).join('\n')}`
  }

  // Country lookup
  const countries = [...new Set(devices.map(d => d.country))]
  for (const country of countries) {
    if (q.includes(country.toLowerCase())) {
      const countryDevices = devices.filter(d => d.country === country)
      const online  = countryDevices.filter(d => d.status === 'online').length
      const offline = countryDevices.filter(d => d.status === 'offline').length
      const warning = countryDevices.filter(d => d.status === 'warning').length
      return `**${country}** has **${countryDevices.length} device(s)** — ${online} online, ${offline} offline, ${warning} warning.\n\nCities: ${[...new Set(countryDevices.map(d => d.city))].join(', ')}`
    }
  }

  // ── IPsec / BGP section ──────────────────────────────────────────────────

  // IPsec summary / overview
  if (q.includes('ipsec') && (q.includes('summar') || q.includes('overview') || q.includes('status') || q.includes('all') || q.includes('total'))) {
    const inc = ipsecTunnels.filter(t => t.status !== 'up')
    return `**IPsec Tunnel Status — ${ipsecSummary.total} tunnels monitored**\n✅ Up: ${ipsecSummary.up}  ⚠️ Degraded: ${ipsecSummary.degraded}  ❌ Down: ${ipsecSummary.down}\n\n**Active incidents (${inc.length}):**\n${inc.map(t => `• ${t.name} — ${t.status.toUpperCase()} — ${t.lastError}`).join('\n')}`
  }

  // BGP summary / overview
  if (q.includes('bgp') && (q.includes('summar') || q.includes('overview') || q.includes('status') || q.includes('all') || q.includes('total') || q.includes('session'))) {
    const inc = bgpSessions.filter(s => s.status !== 'established' || s.lastError)
    return `**BGP Session Status — ${bgpSummary.total} sessions monitored**\n✅ Established: ${bgpSummary.established}  ⚡ Active: ${bgpSummary.active}  ❌ Idle: ${bgpSummary.idle}\n\n**Sessions with issues (${inc.length}):**\n${inc.map(s => `• ${s.name} — ${s.status.toUpperCase()} — ${s.lastError?.split('—')[0].trim()}`).join('\n')}`
  }

  // Tunnels that are down
  if ((q.includes('ipsec') || q.includes('tunnel')) && (q.includes('down') || q.includes('failed') || q.includes('offline'))) {
    const down = ipsecTunnels.filter(t => t.status === 'down')
    return `**${down.length} IPsec tunnel(s) are DOWN:**\n${down.map(t =>
      `• **${t.name}**\n  Error: ${t.lastError}\n  Down since: ${new Date(t.downSince).toUTCString()}\n  Fix: ${t.recommendation}`
    ).join('\n\n')}`
  }

  // Tunnels that are degraded
  if ((q.includes('ipsec') || q.includes('tunnel')) && (q.includes('degrad') || q.includes('warning') || q.includes('issue') || q.includes('problem'))) {
    const deg = ipsecTunnels.filter(t => t.status === 'degraded')
    return `**${deg.length} IPsec tunnel(s) DEGRADED:**\n${deg.map(t =>
      `• **${t.name}** — ${t.lastError.split('—')[0].trim()}\n  Fix: ${t.recommendation}`
    ).join('\n\n')}`
  }

  // Phase 2 / proposal mismatch
  if (q.includes('phase 2') || q.includes('phase2') || q.includes('proposal') || q.includes('mismatch') || q.includes('ike_auth')) {
    const t = ipsecTunnels.find(t => t.id === 'ipsec-i03')
    return `**Phase 2 Proposal Mismatch — ${t.name}**\n\nError: ${t.lastError}\n\nSite: ${t.localSite} → ${t.remoteSite}\nLocal config: ${t.encryption} / ${t.auth}\n\n**Fix:** ${t.recommendation}`
  }

  // DPD / dead peer detection
  if (q.includes('dpd') || q.includes('dead peer') || q.includes('unreachable')) {
    const t = ipsecTunnels.find(t => t.id === 'ipsec-i01')
    return `**DPD Timeout — ${t.name}**\n\nError: ${t.lastError}\nSite: ${t.localSite} → ${t.remoteSite}\nDown since: ${new Date(t.downSince).toUTCString()}\n\n**Fix:** ${t.recommendation}`
  }

  // Certificate expiry
  if (q.includes('cert') || q.includes('expir') || q.includes('pki') || q.includes('rekey')) {
    const t = ipsecTunnels.find(t => t.id === 'ipsec-i08')
    return `**Certificate Expiry Warning — ${t.name}**\n\nError: ${t.lastError}\nSite: ${t.localSite} → ${t.remoteSite}\nStatus: ${t.status.toUpperCase()}\n\n**Fix:** ${t.recommendation}`
  }

  // Packet loss (general)
  if (q.includes('packet loss') || q.includes('congestion')) {
    const lossy = ipsecTunnels.filter(t => t.packetLoss && parseFloat(t.packetLoss) > 0)
    return `**${lossy.length} tunnel(s) with packet loss:**\n${lossy.map(t =>
      `• **${t.name}** — Loss: ${t.packetLoss}, Latency: ${t.latency}\n  ${t.recommendation}`
    ).join('\n\n')}`
  }

  // High latency
  if (q.includes('latency') || q.includes('slow') || q.includes('routing loop') || q.includes('traceroute')) {
    const t = ipsecTunnels.find(t => t.id === 'ipsec-i05')
    return `**High Latency — ${t.name}**\n\nError: ${t.lastError}\nCurrent latency: ${t.latency} (baseline 45ms)\nThroughput: ${t.throughput}\n\n**Fix:** ${t.recommendation}`
  }

  // BGP idle / down sessions
  if (q.includes('bgp') && (q.includes('idle') || q.includes('down') || q.includes('not establish'))) {
    const idle = bgpSessions.filter(s => s.status === 'idle')
    return `**${idle.length} BGP session(s) IDLE:**\n${idle.map(s =>
      `• **${s.name}** (AS${s.localAS} ↔ AS${s.remoteAS})\n  ${s.lastError}\n  Fix: ${s.recommendation}`
    ).join('\n\n')}`
  }

  // BGP flapping / resets
  if (q.includes('bgp') && (q.includes('flap') || q.includes('reset') || q.includes('unstable') || q.includes('drop'))) {
    const flap = bgpSessions.filter(s => s.lastError?.toLowerCase().includes('flap') || s.lastError?.toLowerCase().includes('reset'))
    if (flap.length) {
      return `**BGP sessions flapping (${flap.length}):**\n${flap.map(s =>
        `• **${s.name}** — ${s.lastError}\n  Fix: ${s.recommendation}`
      ).join('\n\n')}`
    }
  }

  // BGP hold timer
  if (q.includes('hold timer') || q.includes('keepalive') || q.includes('hold time')) {
    const t = bgpSessions.find(s => s.id === 'bgp-i05')
    return `**BGP Hold Timer Issue — ${t.name}**\n\nError: ${t.lastError}\nCurrent hold-time: ${t.holdTime}s / keepalive: ${t.keepalive}s\n\n**Fix:** ${t.recommendation}`
  }

  // BGP route flap dampening
  if (q.includes('dampening') || q.includes('suppressed') || q.includes('flap damp')) {
    const t = bgpSessions.find(s => s.id === 'bgp-i07')
    return `**Route Flap Dampening — ${t.name}**\n\nError: ${t.lastError}\nSession uptime: ${t.uptime} — Prefixes received: ${t.prefixesReceived}\n\n**Fix:** ${t.recommendation}`
  }

  // BGP prefixes / route policy / community
  if (q.includes('prefix') || q.includes('route') || q.includes('community') || q.includes('policy') || q.includes('filter')) {
    const t = bgpSessions.find(s => s.id === 'bgp-i06')
    return `**BGP Route Policy Issue — ${t.name}**\n\nError: ${t.lastError}\nPrefixes received: ${t.prefixesReceived} ← should be ~400+\nSession uptime: ${t.uptime}\n\n**Fix:** ${t.recommendation}`
  }

  // Specific device troubleshooting (by name keyword)
  const deviceKeywords = [
    { key: 'chicago', ipsecId: 'ipsec-i01', bgpId: 'bgp-i01' },
    { key: 'chi-branch', ipsecId: 'ipsec-i01', bgpId: 'bgp-i01' },
    { key: 'nairobi', ipsecId: 'ipsec-i02', bgpId: 'bgp-i02' },
    { key: 'nbo-branch', ipsecId: 'ipsec-i02', bgpId: 'bgp-i02' },
    { key: 'riyadh', ipsecId: 'ipsec-i03', bgpId: 'bgp-i03' },
    { key: 'ruh-branch', ipsecId: 'ipsec-i03', bgpId: 'bgp-i03' },
    { key: 'los angeles', ipsecId: 'ipsec-i04', bgpId: 'bgp-i04' },
    { key: 'la-branch', ipsecId: 'ipsec-i04', bgpId: 'bgp-i04' },
    { key: 'san francisco', ipsecId: 'ipsec-i05', bgpId: null },
    { key: 'sfo-branch', ipsecId: 'ipsec-i05', bgpId: null },
    { key: 'delhi', ipsecId: 'ipsec-i06', bgpId: 'bgp-i08' },
    { key: 'del-branch', ipsecId: 'ipsec-i06', bgpId: 'bgp-i08' },
    { key: 'johannesburg', ipsecId: 'ipsec-i07', bgpId: null },
    { key: 'jnb-branch', ipsecId: 'ipsec-i07', bgpId: null },
    { key: 'mexico', ipsecId: 'ipsec-i08', bgpId: null },
    { key: 'mex-branch', ipsecId: 'ipsec-i08', bgpId: null },
    { key: 'hong kong', ipsecId: null, bgpId: 'bgp-i05' },
    { key: 'hkg-branch', ipsecId: null, bgpId: 'bgp-i05' },
    { key: 'milan', ipsecId: null, bgpId: 'bgp-i06' },
    { key: 'mil-branch', ipsecId: null, bgpId: 'bgp-i06' },
    { key: 'buenos aires', ipsecId: null, bgpId: 'bgp-i07' },
    { key: 'bue-branch', ipsecId: null, bgpId: 'bgp-i07' },
  ]
  for (const { key, ipsecId, bgpId } of deviceKeywords) {
    if (q.includes(key)) {
      const lines = []
      if (ipsecId) {
        const t = ipsecTunnels.find(t => t.id === ipsecId)
        lines.push(`**IPsec — ${t.name}**\nStatus: ${t.status.toUpperCase()}\nError: ${t.lastError}\nFix: ${t.recommendation}`)
      }
      if (bgpId) {
        const s = bgpSessions.find(s => s.id === bgpId)
        lines.push(`**BGP — ${s.name}**\nStatus: ${s.status.toUpperCase()}\nError: ${s.lastError}\nFix: ${s.recommendation}`)
      }
      if (lines.length) return lines.join('\n\n')
    }
  }

  // Generic IPsec/BGP fallback
  if (q.includes('ipsec') || q.includes('tunnel') || q.includes('bgp') || q.includes('vpn') || q.includes('troubleshoot')) {
    return `**IPsec & BGP Incident Summary**\n\nIPsec: ${ipsecSummary.up} up · ${ipsecSummary.degraded} degraded · ${ipsecSummary.down} down\nBGP: ${bgpSummary.established} established · ${bgpSummary.active} active · ${bgpSummary.idle} idle\n\nTry asking:\n• "Which IPsec tunnels are down?"\n• "Show degraded tunnels"\n• "Any BGP sessions flapping?"\n• "What's wrong with Chicago?"\n• "Explain the Phase 2 mismatch"\n• "Any certificate expiry alerts?"`
  }

  // Fallback
  return `I can answer questions about the **${devices.length} devices** on the map, plus IPsec tunnels and BGP sessions.\n\nTry asking:\n• "How many devices are in Europe?"\n• "Which devices are offline?"\n• "Which IPsec tunnels are down?"\n• "Any BGP flapping?"\n• "What's wrong with Chicago?"\n\n*(Mock mode — set ANTHROPIC_API_KEY in .env for full AI responses)*`
}

// ── System prompt for Claude ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI-Powered IPsec & BGP Troubleshooting Agent embedded in the Infoblox SASE Control Center dashboard. \
You have real-time visibility into the global branch device infrastructure, IPsec tunnels, and BGP sessions.

NETWORK OVERVIEW:
- Total devices: ${devices.length}
- Online: ${statusTotals.online} | Offline: ${statusTotals.offline} | Warning: ${statusTotals.warning}

IPSEC TUNNEL STATUS:
- Total: ${ipsecSummary.total} | Up: ${ipsecSummary.up} | Degraded: ${ipsecSummary.degraded} | Down: ${ipsecSummary.down}

BGP SESSION STATUS:
- Total: ${bgpSummary.total} | Established: ${bgpSummary.established} | Active: ${bgpSummary.active} | Idle: ${bgpSummary.idle}

REGIONAL BREAKDOWN:
${JSON.stringify(regionData, null, 2)}

DEVICE LIST (name | type | status | city | country | region | bandwidth | uptime):
${devices.map(d =>
  `${d.name} | ${d.type} | ${d.status} | ${d.city} | ${d.country} | ${d.region} | ${d.bandwidth} | ${d.uptime}`
).join('\n')}

IPSEC TUNNEL INCIDENTS:
${ipsecTunnels.filter(t => t.status !== 'up').map(t =>
  `${t.name} | ${t.status} | Phase1:${t.phase1} Phase2:${t.phase2} | ${t.lastError} | Fix: ${t.recommendation}`
).join('\n')}

BGP SESSION INCIDENTS:
${bgpSessions.filter(s => s.lastError).map(s =>
  `${s.name} | AS${s.localAS}↔AS${s.remoteAS} | ${s.status} | Prefixes rcvd:${s.prefixesReceived} | ${s.lastError} | Fix: ${s.recommendation}`
).join('\n')}

Answer questions about network topology, IPsec tunnels, and BGP sessions concisely and accurately. \
For troubleshooting questions, always include: root cause, affected sites, and specific remediation steps. \
When referencing IPsec issues, mention Phase 1/Phase 2 states. \
For BGP, mention session state, prefix counts, and timer values where relevant. \
Keep replies concise unless the user asks for detail.`

// ── Chat endpoint ──────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  if (MOCK_MODE) {
    return res.json({ reply: mockReply(message), mock: true })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
    })
    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('Anthropic error:', err.message)
    const isAuthError =
      err.status === 401 ||
      err.message?.toLowerCase().includes('apikey') ||
      err.message?.toLowerCase().includes('authentication') ||
      err.message?.toLowerCase().includes('authtoken')
    const msg = isAuthError
      ? 'API key missing. Add ANTHROPIC_API_KEY=your_key to .env in the project root.'
      : `AI error: ${err.message}`
    res.status(err.status ?? 500).json({ error: msg })
  }
})

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, devices: devices.length, apiKey: !!API_KEY, mock: MOCK_MODE })
)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`SASE API  →  http://localhost:${PORT}`)
  console.log(`Mode      →  ${MOCK_MODE ? 'MOCK (no API key needed)' : 'Claude AI ✓'}`)
})
