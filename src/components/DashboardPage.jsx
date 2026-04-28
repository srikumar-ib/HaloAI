import { useState, useMemo } from 'react'
import InsightCard from './InsightCard'
import { insights as allInsights, insightsSummary } from '../data/insights'

const NLP_SUGGESTIONS = [
  'IPsec down', 'BGP flapping', 'APAC issues',
  'Critical only', 'Recurring', 'NA region',
]

function nlpFilter(list, query) {
  if (!query.trim()) return list
  const q = query.toLowerCase()
  return list.filter(ins =>
    ins.title.toLowerCase().includes(q) ||
    ins.category.toLowerCase().includes(q) ||
    ins.severity.toLowerCase().includes(q) ||
    ins.affectedRegion.toLowerCase().includes(q) ||
    ins.affectedSite.toLowerCase().includes(q) ||
    ins.summary.toLowerCase().includes(q) ||
    (q.includes('flap') && ins.flapping) ||
    (q.includes('recur') && ins.recurring) ||
    ins.rootCauses.some(rc => rc.cause.toLowerCase().includes(q))
  )
}

export default function DashboardPage() {
  const [activeTab,     setActiveTab]     = useState('all')
  const [nlpQuery,      setNlpQuery]      = useState('')
  const [feedbackMap,   setFeedbackMap]   = useState({})
  const [remediateInfo, setRemediateInfo] = useState(null)
  const [remediateStatus, setRemediateStatus] = useState({})

  const withFeedback = allInsights.map(ins => ({
    ...ins,
    feedback: feedbackMap[ins.id] ?? ins.feedback,
  }))

  const tabFiltered = useMemo(() => {
    const base = activeTab === 'all' ? withFeedback
      : withFeedback.filter(i => i.severity === activeTab)
    return nlpFilter(base, nlpQuery)
  }, [activeTab, nlpQuery, feedbackMap])

  function handleFeedback(id, vote) {
    setFeedbackMap(prev => ({ ...prev, [id]: vote }))
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, vote }),
    }).catch(() => {})
  }

  function handleRemediate(insightId, stepIndex) {
    const ins  = allInsights.find(i => i.id === insightId)
    const step = ins?.remediationSteps.find(s => s.step === stepIndex)
    if (!step) return
    if (step.safe) {
      setRemediateStatus(prev => ({ ...prev, [`${insightId}-${stepIndex}`]: 'running' }))
      fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: insightId, stepIndex }),
      })
        .then(r => r.json())
        .then(() => setRemediateStatus(prev => ({ ...prev, [`${insightId}-${stepIndex}`]: 'done' })))
        .catch(() => setRemediateStatus(prev => ({ ...prev, [`${insightId}-${stepIndex}`]: 'error' })))
    } else {
      setRemediateInfo({ ins, step })
    }
  }

  const counts = {
    total:    allInsights.length,
    critical: allInsights.filter(i => i.severity === 'critical').length,
    high:     allInsights.filter(i => i.severity === 'high').length,
    medium:   allInsights.filter(i => i.severity === 'medium').length,
    healthy:  87 - allInsights.length,
  }

  return (
    <div className="dashboard-page">

      {/* Summary bar */}
      <div className="summary-bar">
        <div className="stat-box stat-box--neutral">
          <span className="stat-num">{counts.total}</span>
          <span className="stat-lbl">Active Issues</span>
        </div>
        <div className="stat-box stat-box--critical">
          <span className="stat-num">{counts.critical}</span>
          <span className="stat-lbl">Critical</span>
        </div>
        <div className="stat-box stat-box--high">
          <span className="stat-num">{counts.high}</span>
          <span className="stat-lbl">High</span>
        </div>
        <div className="stat-box stat-box--medium">
          <span className="stat-num">{counts.medium}</span>
          <span className="stat-lbl">Medium</span>
        </div>
        <div className="stat-box stat-box--healthy">
          <span className="stat-num">{counts.healthy}</span>
          <span className="stat-lbl">Healthy Sites</span>
        </div>
      </div>

      {/* NLP bar */}
      <div className="nlp-bar">
        <div className="nlp-input-wrap">
          <svg className="nlp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="nlp-input"
            type="text"
            placeholder='Ask: "Show IPsec failures in APAC" or "List critical recurring issues"'
            value={nlpQuery}
            onChange={e => setNlpQuery(e.target.value)}
          />
          {nlpQuery && (
            <button className="nlp-clear" onClick={() => setNlpQuery('')}>✕</button>
          )}
        </div>
        <div className="nlp-chips">
          {NLP_SUGGESTIONS.map(s => (
            <button key={s} className="chip" onClick={() => setNlpQuery(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="dashboard-columns">

        {/* Left — insight list */}
        <div className="insight-list-panel">
          <div className="insight-tabs">
            {['all','critical','high','medium'].map(tab => (
              <button
                key={tab}
                className={`insight-tab ${activeTab === tab ? 'insight-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="tab-count">
                  {tab === 'all' ? allInsights.length
                    : allInsights.filter(i => i.severity === tab).length}
                </span>
              </button>
            ))}
            {nlpQuery && (
              <span className="nlp-results-label">{tabFiltered.length} result{tabFiltered.length !== 1 ? 's' : ''} for "{nlpQuery}"</span>
            )}
          </div>

          <div className="insight-list">
            {tabFiltered.length === 0 ? (
              <div className="insight-empty">No issues match your filter.</div>
            ) : (
              tabFiltered.map(ins => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onFeedback={handleFeedback}
                  onRemediate={handleRemediate}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — side panel */}
        <div className="side-panel">

          {/* Top 5 actions */}
          <div className="top-actions-panel">
            <div className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Top 5 Actions
            </div>
            {insightsSummary.topActions.map((a, i) => (
              <div key={a.insightId} className="top-action-row">
                <span className="top-action-rank">{i + 1}</span>
                <span className="top-action-text">{a.action}</span>
              </div>
            ))}
          </div>

          {/* Cross-system correlation timeline */}
          <div className="correlation-timeline-panel">
            <div className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Cross-System Events
            </div>
            {[
              { time: '22:14', system: 'Versa',    event: 'CHI DPD timeout — peer unreachable' },
              { time: '22:16', system: 'Infoblox', event: 'CHI DNS failures from 10.8.0.0/24' },
              { time: '08:30', system: 'Versa',    event: 'NBO IKE Phase 1 timeout' },
              { time: '08:35', system: 'Infoblox', event: 'NBO IPAM sync failure — 10d' },
              { time: '05:22', system: 'Versa',    event: 'RUH Phase 2 proposal rejected' },
              { time: '05:25', system: 'Infoblox', event: 'RUH DNS leaking to 8.8.8.8' },
            ].map((e, i) => (
              <div key={i} className="timeline-row">
                <span className="timeline-time">{e.time}</span>
                <span className={`timeline-dot timeline-dot--${e.system.toLowerCase()}`} />
                <div className="timeline-body">
                  <span className={`corr-badge corr-badge--${e.system.toLowerCase()}`}>{e.system}</span>
                  <span className="timeline-event">{e.event}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recurring issues */}
          <div className="recurring-panel">
            <div className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              Recurring Issues
            </div>
            {allInsights.filter(i => i.recurring).map(ins => (
              <div key={ins.id} className="recurring-row">
                <span className="badge-severity badge-severity--sm" style={{
                  background: { critical:'#f85149', high:'#f0883e', medium:'#d29922' }[ins.severity]
                }}>{ins.severity.toUpperCase()}</span>
                <span className="recurring-site">{ins.affectedSite}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Remediation preview modal */}
      {remediateInfo && (
        <div className="modal-overlay" onClick={() => setRemediateInfo(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Preview Action</div>
            <div className="modal-step">{remediateInfo.step.action}</div>
            <pre className="modal-command">{remediateInfo.step.command}</pre>
            <p className="modal-preview">{remediateInfo.step.preview}</p>
            <div className="modal-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              This action will modify live configuration.
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={() => setRemediateInfo(null)}>Cancel</button>
              <button className="modal-btn modal-btn--execute" onClick={() => {
                fetch('/api/remediate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: remediateInfo.ins.id, stepIndex: remediateInfo.step.step }),
                }).catch(() => {})
                setRemediateInfo(null)
              }}>Execute</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
