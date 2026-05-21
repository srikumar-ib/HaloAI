import { useState, useRef, useEffect } from 'react'
import { mockReply } from '../lib/mockAI.js'

const IQ_SUGGESTIONS = [
  'Which IPsec tunnels are currently down?',
  'Give me a device status summary by region',
  'What is the current token pool balance?',
  'Which BGP sessions are flapping?',
]

export default function ChatPanel({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([])
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

    await new Promise(r => setTimeout(r, 300))
    setMessages([...next, { role: 'assistant', content: mockReply(msg), isMock: true }])
    setLoading(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={`iq-panel ${isOpen ? 'iq-panel--open' : ''}`}>

      {/* ── Header ── */}
      <div className="iq-header">
        <div className="iq-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11l-3.75 2.75 1.5-4.5L6 6.5h4.5z"
              fill="#00a862" opacity="0.9"/>
            <circle cx="12" cy="12" r="10" stroke="#00a862" strokeWidth="1.2" opacity="0.25"/>
          </svg>
          <span className="iq-logo-text">Infoblox IQ</span>
        </div>
        <button className="iq-edit-btn" onClick={onToggle} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {!hasMessages && !loading ? (

        /* ── Initial / greeting state ── */
        <div className="iq-initial">
          <p className="iq-greeting">
            Hi Srikumar, what can I help you with?
          </p>

          <div className="iq-input-wrap">
            <input
              className="iq-input"
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              autoFocus={isOpen}
            />
            <button
              className="iq-send-btn"
              onClick={() => send()}
              disabled={!input.trim()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <div className="iq-suggestion-grid">
            {IQ_SUGGESTIONS.map(s => (
              <button key={s} className="iq-suggestion-card" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

      ) : (

        /* ── Conversation state ── */
        <>
          <div className="iq-messages">
            {messages.map((m, i) => (
              <div key={i} className={`iq-msg iq-msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="iq-msg-avatar">✦</div>
                )}
                <div className={`iq-msg-bubble ${m.isError ? 'iq-msg-bubble--error' : ''}`}>
                  <pre className="iq-msg-text">{m.content}</pre>
                  {m.isMock && <span className="iq-mock-badge">mock</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="iq-msg iq-msg--assistant">
                <div className="iq-msg-avatar">✦</div>
                <div className="iq-msg-bubble iq-msg-bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="iq-input-wrap iq-input-wrap--bottom">
            <input
              className="iq-input"
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              className="iq-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </>

      )}
    </div>
  )
}
