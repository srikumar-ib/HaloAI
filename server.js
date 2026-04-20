import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import { devices, regionSummary, statusTotals } from './src/data/devices.js'

const app = express()
app.use(express.json())
app.use(cors())

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Serialize regionSummary (Sets → arrays) once at startup
const regionData = Object.fromEntries(
  Object.entries(regionSummary).map(([r, v]) => [
    r,
    { ...v, countries: [...v.countries] }
  ])
)

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

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

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
    const status = err.status ?? 500
    const msg = status === 401
      ? 'Invalid API key — set ANTHROPIC_API_KEY in your environment.'
      : `AI error: ${err.message}`
    res.status(status).json({ error: msg })
  }
})

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, devices: devices.length, apiKey: !!process.env.ANTHROPIC_API_KEY })
)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`SASE API  →  http://localhost:${PORT}`)
  console.log(`API key   →  ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING (set ANTHROPIC_API_KEY)'}`)
})
