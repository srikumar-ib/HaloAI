import { useState, useRef, useEffect } from 'react'

const WELCOME = {
  role: 'assistant',
  content: `Hi! I'm your Network AI Assistant for the SASE Control Center.

I have full visibility into all ${87} branch devices across the globe. Try asking:

  • How many devices are in Europe?
  • Which devices are currently offline?
  • Show me device counts by region.
  • Any warnings in Asia-Pacific?
  • Which country has the most devices?`
}

const SUGGESTIONS = [
  'Devices in Europe?',
  'Any offline devices?',
  'Asia-Pacific count?',
  'Devices by region?'
]

export default function ChatPanel({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const next = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message: msg,
          history: messages
            .filter(m => m !== WELCOME)
            .map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setMessages([...next, {
        role:    'assistant',
        content: data.error ? `Error: ${data.error}` : data.reply,
        isError: !!data.error
      }])
    } catch {
      setMessages([...next, {
        role:    'assistant',
        content: 'Connection error — make sure the server is running (`npm run dev`).',
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating action button */}
      <button
        className={`chat-fab ${isOpen ? 'chat-fab--open' : ''}`}
        onClick={onToggle}
        title="Network AI Assistant"
      >
        {isOpen
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
        {!isOpen && <span className="chat-fab-label">AI Agent</span>}
      </button>

      {/* Slide-in panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="chat-title">Network AI Assistant</div>
              <div className="chat-subtitle">SASE Control Center · 87 devices</div>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onToggle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg msg--${m.role} ${m.isError ? 'msg--error' : ''}`}>
              {m.role === 'assistant' && <div className="msg-avatar">AI</div>}
              <div className="msg-bubble">
                <pre className="msg-text">{m.content}</pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg msg--assistant">
              <div className="msg-avatar">AI</div>
              <div className="msg-bubble msg-bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="chat-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            placeholder="Ask about your network topology…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
