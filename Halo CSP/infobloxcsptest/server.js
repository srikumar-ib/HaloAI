import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import { devices, regionSummary, statusTotals } from './src/data/devices.js'
import { ipsecTunnels, bgpSessions, ipsecSummary, bgpSummary } from './src/data/network.js'
import {
  niosxSizes, tokenPacks, regionCloudMap, demoEnv, regionBreakdown,
  demoTokenEstimate, skuCatalog, pocConfig, calculateTokens,
  tokenPool, tokenHistory, regionTokenAllocation, tokenDrivers,
  tokenAlerts, tokenForecast,
} from './src/data/catalog.js'
import { insights, insightsSummary } from './src/data/insights.js'

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

  // ── Seller / Channel-Partner Copilot ────────────────────────────────────────

  const isSellerQuery =
    q.includes('token') || q.includes('sku') || q.includes('pricing') || q.includes('quote') ||
    q.includes('niosx') || q.includes('nios-x') || q.includes('nios x') || q.includes('niosxaas') ||
    q.includes('server size') || q.includes('form factor') || q.includes('how many token') ||
    q.includes('estimate') || q.includes('calculat') || q.includes('size') && q.includes('server') ||
    q.includes('poc') || q.includes('proof of concept') || q.includes('cloud') && q.includes('deploy') ||
    q.includes('where') && (q.includes('deploy') || q.includes('install') || q.includes('host')) ||
    q.includes('latency') && q.includes('cloud') || q.includes('aws') || q.includes('azure') ||
    q.includes('management token') || q.includes('server token') || q.includes('reporting token') ||
    q.includes('assumption') || q.includes('how is') && q.includes('calculat') ||
    q.includes('balance') || q.includes('pool') || q.includes('utiliz') || q.includes('utilis') ||
    q.includes('trend') || q.includes('history') || q.includes('month') || q.includes('growth') ||
    q.includes('alert') || q.includes('forecast') || q.includes('renewal') || q.includes('expir') ||
    q.includes('burn rate') || q.includes('driver') || q.includes('what consume') ||
    q.includes('region') && q.includes('token') || q.includes('allocation') || q.includes('shortfall')

  if (!isSellerQuery) {
    // fall through to IPsec/BGP section
  } else {

  // ── Token pool / balance / current status ───────────────────────────────
  if (q.includes('balance') || q.includes('pool') || q.includes('current') && q.includes('token') ||
      q.includes('how many token') && q.includes('left') || q.includes('available token') ||
      q.includes('token status') || q.includes('utiliz') || q.includes('utilis')) {
    const p = tokenPool
    const mgmt = p.categories.management
    const srv  = p.categories.server
    const rpt  = p.categories.reporting
    return `**Token Pool Status — as of ${p.asOf}**
Contract: ${p.contractStart} → ${p.contractExpiry}

                    Purchased  Allocated  Consumed  Util%
Management tokens:   ${String(mgmt.purchased).padStart(5)}     ${String(mgmt.allocated).padStart(5)}     ${String(mgmt.consumed).padStart(5)}    ${mgmt.utilizationPct}%
Server tokens:       ${String(srv.purchased).padStart(5)}     ${String(srv.allocated).padStart(5)}     ${String(srv.consumed).padStart(5)}    ${srv.utilizationPct}%
Reporting tokens:    ${String(rpt.purchased).padStart(5)}       ${String(rpt.allocated).padStart(5)}       ${String(rpt.consumed).padStart(5)}    ${rpt.utilizationPct}%
────────────────────────────────────────────────────────
TOTAL:               ${String(p.purchased).padStart(5)}     ${String(p.allocated).padStart(5)}           ${p.utilizationPct}%

Available (unallocated): ${p.available} tokens
Server deployment: ${srv.deployedMembers} members — ${Object.entries(srv.formFactorBreakdown).filter(([,v])=>v>0).map(([k,v])=>`${v}×${k}`).join(', ')}
Reporting: ${(rpt.monthlyLogEvents/1_000_000).toFixed(0)} M events/month consumed

Ask "token alerts" for utilisation warnings or "token forecast" for renewal guidance.`
  }

  // ── Token consumption trend / history ────────────────────────────────────
  if (q.includes('trend') || q.includes('history') || q.includes('over time') ||
      q.includes('month') && q.includes('token') || q.includes('growth') || q.includes('consumption') && q.includes('token')) {
    const rows = tokenHistory.map(h =>
      `${h.month.padEnd(10)}  Mgmt:${String(h.management).padStart(5)}  Server:${String(h.server).padStart(5)}  Rpt:${String(h.reporting).padStart(4)}  Total:${String(h.total).padStart(5)}  ${h.newDevices > 0 ? `(+${h.newDevices} devices)` : ''}`
    ).join('\n')
    const first = tokenHistory[0].total
    const last  = tokenHistory[tokenHistory.length - 1].total
    const growthPct = (((last - first) / first) * 100).toFixed(1)
    return `**Token Consumption Trend — Nov 2025 to Apr 2026**

${rows}

6-month growth: ${first.toLocaleString()} → ${last.toLocaleString()} tokens (+${growthPct}%)
Driver: Management tokens +${tokenHistory[tokenHistory.length-1].management - tokenHistory[0].management} (new device onboarding across APAC, EMEA, LatAm)
Server tokens flat: deployment unchanged (12 members across 6 regions)
Reporting +${tokenHistory[tokenHistory.length-1].reporting - tokenHistory[0].reporting}: Threat Defense enabled on EU sites in Jan 2026`
  }

  // ── Per-region token allocation ──────────────────────────────────────────
  if (q.includes('region') && q.includes('token') || q.includes('allocation') ||
      q.includes('by region') || q.includes('which region') && q.includes('token')) {
    const rows = Object.entries(regionTokenAllocation).map(([region, r]) => {
      const bar = '█'.repeat(Math.round(r.utilizationPct.management / 10))
      return `**${region}** (${r.managedIPs.toLocaleString()} IPs · ${r.logEventsPerMonth} events/mo)
  Mgmt: ${r.managementTokens} tokens (${r.utilizationPct.management}%)  Server: ${r.serverTokens} tokens (${r.utilizationPct.server}%)  Reporting: ${r.reportingTokens} tokens (${r.utilizationPct.reporting}%)
  Total: ${r.total} tokens  |  NIOSXaaS: ${r.niosxDeployment}  |  Trend: ${r.trend}`
    }).join('\n\n')
    const grandTotal = Object.values(regionTokenAllocation).reduce((s,r)=>s+r.total,0)
    return `**Token Allocation by Region — Total: ${grandTotal.toLocaleString()} tokens**\n\n${rows}\n\nHighest: Asia-Pacific (APAC growing fastest at 92% management utilisation)\nLowest:  Africa (60% management — NBO-Branch-01 offline reducing managed IP count)`
  }

  // ── Token alerts ─────────────────────────────────────────────────────────
  if (q.includes('alert') || q.includes('warning') && q.includes('token') ||
      q.includes('threshold') || q.includes('exceed') || q.includes('near') && q.includes('limit')) {
    const warnings = tokenAlerts.filter(a => a.severity === 'warning')
    const infos    = tokenAlerts.filter(a => a.severity === 'info')
    const fmt = (a) => `[${a.severity.toUpperCase()}] **${a.title}**\n  Region: ${a.region} · Category: ${a.category}\n  ${a.detail}\n  Action: ${a.action}\n  Token impact: ${a.tokenImpact}  |  ${a.urgency}`
    return `**Token Alerts — ${tokenAlerts.length} active (${warnings.length} warnings, ${infos.length} informational)**\n\n${tokenAlerts.map(fmt).join('\n\n')}`
  }

  // ── Token drivers — what consumes each type ──────────────────────────────
  if (q.includes('driver') || q.includes('what consume') || q.includes('what use') ||
      q.includes('how is') && q.includes('token') || q.includes('what drive') ||
      q.includes('management token') && (q.includes('why') || q.includes('what') || q.includes('how')) ||
      q.includes('reporting token') && (q.includes('why') || q.includes('what') || q.includes('how'))) {
    const out = Object.entries(tokenDrivers).map(([type, d]) => {
      const rows = d.drivers.map(dr =>
        `  • ${dr.driver.padEnd(36)} ${dr.rate.padEnd(28)} [${dr.basis}]\n    Example: ${dr.example}`
      ).join('\n')
      return `**${type.charAt(0).toUpperCase()+type.slice(1)} Tokens** — ${d.description}\n${rows}\n  Demo total: ${d.total_raw_demo ?? d.total_deployed_demo} raw → ${d.total_purchased_demo} purchased (rounded to pack)\n  ${d.note ?? ''}`
    }).join('\n\n')
    return `**Token Consumption Drivers**\n\n${out}`
  }

  // ── Renewal forecast ─────────────────────────────────────────────────────
  if (q.includes('forecast') || q.includes('renewal') || q.includes('expir') ||
      q.includes('burn rate') || q.includes('run out') || q.includes('shortfall') ||
      q.includes('next year') || q.includes('next contract')) {
    const f = tokenForecast
    const r = f.renewalRecommendation
    return `**Token Renewal Forecast — Contract expires ${f.contractExpiry}**

Current monthly burn: ${f.currentMonthlyBurn.toLocaleString()} tokens
Monthly growth rate:  ${f.growthRatePctPerMonth}% (6-month trailing average)
Projected burn at renewal: ~${f.projectedBurnAtRenewal.toLocaleString()} tokens/month
Months remaining: ${f.monthsRemaining}
Projected shortfall vs current purchase: ${f.projectedShortfall > 0 ? f.projectedShortfall + ' tokens' : 'None — within current pack at current growth rate'}

RENEWAL RECOMMENDATION
──────────────────────────────────────────────────────
Management  Current: ${r.management.current.toLocaleString()}  →  Recommended: ${r.management.recommended.toLocaleString()} (${r.management.delta})
            ${r.management.reason}
Server      Current: ${r.server.current.toLocaleString()}  →  Recommended: ${r.server.recommended.toLocaleString()} (${r.server.delta})
            ${r.server.reason}
Reporting   Current: ${r.reporting.current}  →  Recommended: ${r.reporting.recommended.toLocaleString()} (${r.reporting.delta})
            ${r.reporting.reason}
──────────────────────────────────────────────────────
TOTAL:      Current: ${r.total.current.toLocaleString()}  →  Recommended: ${r.total.recommended.toLocaleString()} (${r.total.delta})

${f.notes.map(n => `• ${n}`).join('\n')}`
  }

  // ── Token estimate overview / total ──────────────────────────────────────
  if (q.includes('how many token') || q.includes('token estimate') || q.includes('total token') ||
      (q.includes('token') && (q.includes('need') || q.includes('requir') || q.includes('environment') || q.includes('calculat')))) {
    const e = demoTokenEstimate
    const rows = Object.entries(e.regionSizing).map(([r, s]) =>
      `  ${r.padEnd(18)} ${s.formFactor} × ${s.serversDeployed}  ${String(s.serverTokensUsed).padStart(5)} server tokens  (${s.branches}B + ${s.hubs}H, ${s.peakQps} QPS peak)`
    ).join('\n')
    return `**Infoblox Token Estimate — ${e.inputs.sites}-device Versa SD-WAN environment**

Environment: ${e.inputs.branchCount} branch sites + ${e.inputs.hubCount} hub/DC sites · 6 regions
Managed IPs: ${e.inputs.totalManagedIPs.toLocaleString()}

TOKEN BREAKDOWN
────────────────────────────────────────────────
Management  ${String(e.management.tokens).padStart(6)} tokens  (${e.management.packs} × 1 000-pack)
            Basis: ${e.inputs.totalManagedIPs.toLocaleString()} managed IPs ÷ 5 = ${e.management.raw} raw → rounded up
Server      ${String(e.server.tokens).padStart(6)} tokens  (${e.server.packs} × 500-pack)
            Per region (HA pair per region):
${rows}
Reporting   ${String(e.reporting.tokens).padStart(6)} tokens  (${e.reporting.packs} × 40-pack)
            ${(e.reporting.monthlyEvents / 1_000_000).toFixed(0)} M log events/month ÷ 10 M × 40 = ${e.reporting.raw} raw
────────────────────────────────────────────────
TOTAL       ${String(e.total).padStart(6)} tokens

Key assumptions: 50 endpoints/branch · 200/hub · 30 QPS/branch · 150 QPS/hub · 85% DNS CHR · 1.3× headroom · HA pair/region
Ask "explain assumptions" for the full model or "show per-region sizing" for server details.`
  }

  // ── Per-region sizing detail ─────────────────────────────────────────────
  if (q.includes('per-region') || q.includes('per region') || q.includes('region') && q.includes('siz') ||
      q.includes('which server') || q.includes('server per region') || q.includes('niosx per')) {
    const e = demoTokenEstimate
    const lines = Object.entries(e.regionSizing).map(([region, s]) => {
      const cloud = regionCloudMap[region]
      return `**${region}**
  Sites: ${s.branches} branches + ${s.hubs} hubs  |  Peak QPS: ${s.peakQps} → required (×1.3): ${s.requiredQps}
  Form factor: **${s.formFactor}** (${s.vCPU} vCPU / ${s.ramGB} GB RAM · ${s.dnsQpsCapacity.toLocaleString()} QPS capacity @ 85% CHR)
  Servers: ${s.serversDeployed} × ${s.formFactor} = ${s.serverTokensUsed} server tokens
  NIOSXaaS location: ${cloud.primary.cloud} ${cloud.primary.region} (~${cloud.primary.latencyToHub} to hub)
  Failover: ${cloud.secondary.cloud} ${cloud.secondary.region}
  Note: ${cloud.notes}`
    })
    return `**NIOSXaaS Per-Region Sizing — ${e.inputs.sites}-device environment**\n\n${lines.join('\n\n')}`
  }

  // ── NIOSXaaS form factor catalogue ──────────────────────────────────────
  if (q.includes('form factor') || q.includes('all size') || q.includes('server size') || q.includes('niosx size') ||
      q.includes('xs') || q.includes(' s ') || q.includes(' m ') || q.includes(' l ') || q.includes(' xl ')) {
    const rows = niosxSizes.map(s =>
      `**${s.label}** (${s.serverTokens} tokens) — ${s.vCPU} vCPU / ${s.ramGB} GB RAM\n` +
      `  DNS: ${s.dnsQPS_85CHR.toLocaleString()} QPS @ 85% CHR  |  DHCP: ${s.dhcpLPS} LPS  |  IPAM objects: ${s.ipamObjects.toLocaleString()}\n` +
      `  Max sites: ${s.maxSites}  |  Cloud equiv: ${s.cloudEquiv}\n` +
      `  Use case: ${s.useCase}`
    ).join('\n\n')
    return `**NIOSXaaS Form Factors — All Sizes**\n\n${rows}\n\n*Note: XS vCPU/RAM confirmed from Infoblox docs. M/L/XL estimated from published benchmarks — verify with Infoblox SE before quoting.*`
  }

  // ── Best cloud location for NIOSXaaS ────────────────────────────────────
  if (q.includes('where') || q.includes('location') || q.includes('cloud region') || q.includes('deploy') ||
      q.includes('best') && q.includes('cloud') || q.includes('aws region') || q.includes('latency') && q.includes('deploy')) {
    const lines = Object.entries(regionCloudMap).map(([region, c]) =>
      `**${region}**\n` +
      `  Primary:   ${c.primary.cloud} — ${c.primary.region}  (${c.primary.latencyToHub} to hub)\n` +
      `  Secondary: ${c.secondary.cloud} — ${c.secondary.region}  (${c.secondary.latencyToHub})\n` +
      `  Note: ${c.notes}`
    )
    return `**Recommended NIOSXaaS Deployment Locations**\n\nBasis: <20 ms hub-to-DNS latency target, co-located with Versa SD-WAN controller PoP where possible.\n\n${lines.join('\n\n')}`
  }

  // ── What-if calculator — custom site count ───────────────────────────────
  const siteMatch = q.match(/(\d+)\s+site/)
  if (siteMatch) {
    const requestedSites = parseInt(siteMatch[1], 10)
    const hubGuess = Math.max(1, Math.round(requestedSites * 0.1))
    const regCount = requestedSites <= 10 ? 1 : requestedSites <= 30 ? 2 : requestedSites <= 60 ? 3 : requestedSites <= 100 ? 4 : 6
    // build proportional region breakdown
    const branchPer = Math.floor((requestedSites - hubGuess) / regCount)
    const hubPer    = Math.max(1, Math.floor(hubGuess / regCount))
    const customBreakdown = Object.fromEntries(
      Object.keys(regionBreakdown).slice(0, regCount).map(r => [r, { branches: branchPer, hubs: hubPer }])
    )
    const est = calculateTokens({
      sites: requestedSites, hubCount: hubGuess,
      regionCount: regCount, regBreakdown: customBreakdown,
    })
    return `**Token Estimate for ${requestedSites}-site deployment**

Assumed: ${est.inputs.branchCount} branches + ${est.inputs.hubCount} hubs · ${regCount} region(s)
Managed IPs: ~${est.inputs.totalManagedIPs.toLocaleString()} (50/branch · 200/hub)

Management tokens: ${est.management.tokens.toLocaleString()} (${est.management.packs} × 1 000-pack)
Server tokens:     ${est.server.tokens.toLocaleString()} (${est.server.packs} × 500-pack)
Reporting tokens:  ${est.reporting.tokens.toLocaleString()} (${est.reporting.packs} × 40-pack)
─────────────────────────────────────
TOTAL:             ${est.total.toLocaleString()} tokens

*Assumptions: same per-site rates as base model. Adjust for actual QPS, endpoint density, and HA requirements in formal quote.*`
  }

  // ── PoC configuration ────────────────────────────────────────────────────
  if (q.includes('poc') || q.includes('proof of concept') || q.includes('pilot') || q.includes('trial')) {
    const svrs = pocConfig.servers.map(s => `• ${s.role}: NIOSXaaS ${s.formFactor} — ${s.cloud}`).join('\n')
    const sc   = pocConfig.successCriteria.map(c => `  ✓ ${c}`).join('\n')
    return `**Recommended PoC Configuration — Versa + Infoblox**

Duration: ${pocConfig.duration}
Min tokens: ~${pocConfig.minTokens.toLocaleString()}
Scope: ${pocConfig.scope}

Servers:
${svrs}

Success Criteria:
${sc}

*Tip: Start with an S Grid Master + 2 × XS members. Versa SD-WAN forwarder points to the NIOSXaaS members for DNS resolution over the IPsec tunnel.*`
  }

  // ── SKU list ─────────────────────────────────────────────────────────────
  if (q.includes('sku') || q.includes('part number') || q.includes('product') && q.includes('list') ||
      q.includes('what to quote') || q.includes('quote') || q.includes('bundle')) {
    const rows = skuCatalog.map(s => `**${s.sku}** — ${s.name}\n  ${s.description}\n  Unit: ${s.unit}`).join('\n\n')
    return `**Illustrative Infoblox SKUs — Versa SASE Integration**\n\n${rows}\n\n*Note: SKUs are illustrative for demo purposes. Use official Infoblox price book for formal quotes.*`
  }

  // ── Assumptions explanation ───────────────────────────────────────────────
  if (q.includes('assumption') || q.includes('how is') || q.includes('how are') ||
      q.includes('explain') && q.includes('token') || q.includes('basis') || q.includes('methodology')) {
    return `**Token Calculator — Declared Assumptions**

ENVIRONMENT MODEL
• Branch sites: 50 managed endpoints each (workstations, phones, printers, IoT)
• Hub/DC sites: 200 managed endpoints each (servers, network infra, DMZ)
• Peak DNS QPS: 30/branch · 150/hub (busiest 5-min window — Infoblox billing metric)
• DNS cache hit ratio: 85% (industry standard for a warm enterprise resolver)
• Headroom factor: ×1.3 on peak QPS before form-factor selection (~75% utilisation)
• HA: 2 NIOSXaaS members (HA pair) per region — no single-member production deployments

TOKEN MODEL
• Management tokens: ~1 per 5 active managed IPs (pre-sales estimate; confirm per customer)
  → Official basis: "active IP addresses, IPAM objects, DDI assets" — exact rate not public
• Server tokens: XS 250 · S 470 · M 940 · L 1 880 · XL 3 760 — CONFIRMED from Infoblox docs
• Reporting tokens: 40 per 10 M log events/month — CONFIRMED from Infoblox FAQs
• Pack sizes: Management 1 000 · Server 500 · Reporting 40 — quantities rounded up

NIOSXAAS HARDWARE (where marked ESTIMATED — verify with Infoblox SE)
• XS: 8 vCPU / 8 GB — CONFIRMED
• S: 8 vCPU / 16 GB — ESTIMATED
• M/L/XL: doubled per tier — ESTIMATED (official datasheet unavailable at authoring time)
• DNS QPS at 85% CHR: XS 681 · S 2 900 · M 14 800 · L 35 000 — CONFIRMED from benchmarks
• XL QPS (70 000) — ESTIMATED (2× L)
• DHCP LPS and IPAM object limits — ESTIMATED

CLOUD PLACEMENT
• Target: <20 ms hub-to-NIOSXaaS latency (inline with Versa SD-WAN control plane)
• Preference: same-city PoP > same-country > nearest low-latency region
• Reference cloud: AWS (Azure/GCP equivalents available on request)`
  }

  // ── Generic seller copilot fallback ─────────────────────────────────────
  return `**Seller / Channel-Partner Copilot — Infoblox × Versa SASE**

TOKEN CALCULATOR & SIZING
• "How many tokens does this environment need?"
• "Show per-region NIOSXaaS sizing"
• "What are the NIOSXaaS form factors?"
• "Best cloud location to deploy NIOSXaaS?"
• "Estimate tokens for 50 sites"

TOKEN OPERATIONS
• "What's my current token balance?"
• "Show token consumption trend"
• "Token allocation by region"
• "Any token alerts?"
• "What drives management token usage?"
• "Token renewal forecast"

SALES
• "What's the recommended PoC setup?"
• "Show me the SKU list"
• "Explain the token calculation assumptions"`

  } // end isSellerQuery block

  // Generic IPsec/BGP fallback
  if (q.includes('ipsec') || q.includes('tunnel') || q.includes('bgp') || q.includes('vpn') || q.includes('troubleshoot')) {
    return `**IPsec & BGP Incident Summary**\n\nIPsec: ${ipsecSummary.up} up · ${ipsecSummary.degraded} degraded · ${ipsecSummary.down} down\nBGP: ${bgpSummary.established} established · ${bgpSummary.active} active · ${bgpSummary.idle} idle\n\nTry asking:\n• "Which IPsec tunnels are down?"\n• "Show degraded tunnels"\n• "Any BGP sessions flapping?"\n• "What's wrong with Chicago?"\n• "Explain the Phase 2 mismatch"\n• "Any certificate expiry alerts?"`
  }

  // Fallback
  return `I can answer questions across three domains:\n\n**Network Topology**\n• "How many devices are in Europe?"\n• "Which devices are offline?"\n\n**IPsec & BGP Troubleshooting**\n• "Which tunnels are down?" · "Any BGP flapping?" · "What's wrong with Chicago?"\n\n**Seller / Partner Copilot**\n• "How many tokens does this environment need?"\n• "What size NIOSXaaS servers for APAC?"\n• "Best cloud location for NIOSXaaS?"\n• "Estimate tokens for 50 sites"\n\n*(Mock mode — set ANTHROPIC_API_KEY in .env for full AI responses)*`
}

// ── System prompt for Claude ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI assistant embedded in the Infoblox SASE Control Center. \
You operate across three domains: (1) network topology, (2) IPsec & BGP troubleshooting, and (3) seller/channel-partner copilot for token estimates, NIOSXaaS sizing, and cloud placement.

TOKEN CALCULATOR ASSUMPTIONS (declare these when answering sizing questions):
- 50 managed endpoints per branch, 200 per hub
- Peak DNS: 30 QPS/branch · 150 QPS/hub · 85% cache hit ratio · 1.3× headroom
- Management tokens: ~1 per 5 managed IPs (pre-sales estimate; unconfirmed per-IP rate)
- Server tokens confirmed: XS 250 · S 470 · M 940 · L 1 880 · XL 3 760
- Reporting: 40 tokens per 10 M log events/month
- HA pair per region assumed

NIOSXAAS FORM FACTORS (DNS QPS at 85% CHR — confirmed from Infoblox benchmarks):
XS: 8vCPU/8GB · 681 QPS · 250 server tokens · up to 5 sites
S:  8vCPU/16GB · 2 900 QPS · 470 server tokens · up to 15 sites [16GB ESTIMATED]
M:  16vCPU/32GB · 14 800 QPS · 940 server tokens · up to 40 sites [ESTIMATED]
L:  32vCPU/64GB · 35 000 QPS · 1 880 server tokens · up to 100 sites [ESTIMATED]
XL: 64vCPU/128GB · 70 000 QPS · 3 760 server tokens · 100+ sites [ESTIMATED]

TOKEN ESTIMATE FOR THIS ENVIRONMENT (${demoEnv.totalDevices} devices, 6 regions):
Management: ${demoTokenEstimate.management.tokens} tokens (${demoTokenEstimate.management.packs} packs)
Server:     ${demoTokenEstimate.server.tokens} tokens (${demoTokenEstimate.server.packs} packs)
Reporting:  ${demoTokenEstimate.reporting.tokens} tokens (${demoTokenEstimate.reporting.packs} packs)
Total:      ${demoTokenEstimate.total} tokens

RECOMMENDED NIOSXAAS CLOUD LOCATIONS:
${Object.entries(regionCloudMap).map(([r, c]) => `${r}: ${c.primary.cloud} ${c.primary.region} (${c.primary.latencyToHub}) | failover: ${c.secondary.region}`).join('\n')}

POC CONFIGURATION: Grid Master S + 2× XS members · ${pocConfig.minTokens} tokens · ${pocConfig.duration}

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

// ── Dashboard endpoints ───────────────────────────────────────────────────────

app.get('/api/dashboard', (_req, res) => {
  const top5 = insights
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 5)
  res.json({ summary: insightsSummary, topInsights: top5 })
})

const feedbackStore = {}

app.post('/api/nlp-query', (req, res) => {
  const { query = '' } = req.body
  const q = query.toLowerCase().trim()
  if (!q) return res.json({ results: insights, matchedFilters: [] })

  const matchedFilters = []
  const results = insights.filter(ins => {
    const hits = [
      ins.title.toLowerCase(),
      ins.category.toLowerCase(),
      ins.severity.toLowerCase(),
      ins.affectedRegion.toLowerCase(),
      ins.affectedSite.toLowerCase(),
      ins.summary.toLowerCase(),
      ...ins.rootCauses.map(r => r.cause.toLowerCase()),
    ].some(field => field.includes(q))

    if (q.includes('flap')   && ins.flapping)  { matchedFilters.push('flapping');  return true }
    if (q.includes('recur')  && ins.recurring) { matchedFilters.push('recurring'); return true }
    return hits
  })

  const unique = [...new Set(matchedFilters)]
  res.json({ results, matchedFilters: unique, query })
})

app.post('/api/feedback', (req, res) => {
  const { id, vote, comment = '' } = req.body
  if (!id || !vote) return res.status(400).json({ error: 'id and vote required' })
  feedbackStore[id] = { vote, comment, timestamp: new Date().toISOString() }
  res.json({ ok: true, id, vote })
})

app.post('/api/remediate', (req, res) => {
  const { id, stepIndex } = req.body
  const ins  = insights.find(i => i.id === id)
  if (!ins) return res.status(404).json({ error: 'insight not found' })
  const step = ins.remediationSteps.find(s => s.step === stepIndex)
  if (!step) return res.status(404).json({ error: 'step not found' })

  if (!step.safe) {
    return res.json({ preview: true, command: step.command, description: step.preview })
  }

  res.json({
    result:  'simulated',
    output:  `[MOCK] Executed: ${step.command}\n[MOCK] Exit code: 0\n[MOCK] Done.`,
    insightId: id,
    step:    stepIndex,
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`SASE API  →  http://localhost:${PORT}`)
  console.log(`Mode      →  ${MOCK_MODE ? 'MOCK (no API key needed)' : 'Claude AI ✓'}`)
})
