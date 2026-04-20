import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import { devices, regionSummary, statusTotals } from './src/data/devices.js'

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

  // Fallback
  return `I can answer questions about the **${devices.length} devices** on the map.\n\nTry asking:\n• "How many devices are in Europe?"\n• "Which devices are offline?"\n• "Show devices by region"\n• "Any warnings in Asia?"\n\n*(Mock mode — set ANTHROPIC_API_KEY in .env for full AI responses)*`
}

// ── System prompt for Claude ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a network topology assistant embedded in the Infoblox SASE Control Center dashboard. \
You have real-time visibility into the global branch device infrastructure shown on the map.

NETWORK OVERVIEW:
- Total devices: ${devices.length}
- Online: ${statusTotals.online}
- Offline: ${statusTotals.offline}
- Warning: ${statusTotals.warning}

REGIONAL BREAKDOWN:
${JSON.stringify(regionData, null, 2)}

FULL DEVICE LIST (name | type | status | city | country | region | bandwidth | uptime):
${devices.map(d =>
  `${d.name} | ${d.type} | ${d.status} | ${d.city} | ${d.country} | ${d.region} | ${d.bandwidth} | ${d.uptime}`
).join('\n')}

Answer questions about the network topology concisely and accurately. \
When giving counts, be precise. Mention status breakdowns where relevant. \
Keep replies short unless the user asks for detail.`

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
