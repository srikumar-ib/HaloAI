export default function InsightCard({ insight, onFeedback, onRemediate }) {
  const severityColor = {
    critical: '#f85149',
    high:     '#f0883e',
    medium:   '#d29922',
  }

  const categoryLabel = {
    ipsec: 'IPsec',
    bgp:   'BGP',
    dns:   'DNS',
    dhcp:  'DHCP',
  }

  const color = severityColor[insight.severity] || '#8b949e'

  return (
    <div className="insight-card" style={{ borderLeftColor: color }}>

      {/* Header row */}
      <div className="insight-card-header">
        <div className="insight-badges">
          <span className="badge-severity" style={{ background: color }}>
            {insight.severity.toUpperCase()}
          </span>
          <span className="badge-category">{categoryLabel[insight.category] || insight.category}</span>
          {insight.flapping  && <span className="badge-flag badge-flag--flapping">FLAPPING</span>}
          {insight.recurring && <span className="badge-flag badge-flag--recurring">RECURRING</span>}
        </div>
        <span className="insight-duration">{insight.duration}</span>
      </div>

      {/* Title + site */}
      <div className="insight-title">{insight.title}</div>
      <div className="insight-site">
        <span className="insight-region">{insight.affectedRegion}</span>
        <span className="insight-site-name">{insight.affectedSite}</span>
        <span className="insight-devices">{insight.affectedDevices.length} device{insight.affectedDevices.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Summary */}
      <p className="insight-summary">{insight.summary}</p>

      {/* Confidence meter */}
      <div className="confidence-section">
        <div className="confidence-label-row">
          <span className="confidence-label">AI Confidence</span>
          <span className="confidence-pct" style={{ color }}>{insight.confidenceScore}%</span>
        </div>
        <div className="confidence-track">
          <div className="confidence-fill" style={{ width: `${insight.confidenceScore}%`, background: color }} />
        </div>
        <p className="confidence-reason">{insight.confidenceReason}</p>
      </div>

      {/* Root causes */}
      <div className="root-causes">
        <div className="section-label">Root Causes</div>
        {insight.rootCauses.map(rc => (
          <div key={rc.rank} className="root-cause-row">
            <span className="rc-rank">#{rc.rank}</span>
            <span className="rc-cause">{rc.cause}</span>
            <span className="rc-confidence">{rc.confidence}%</span>
          </div>
        ))}
      </div>

      {/* Impact */}
      <div className="impact-row">
        <div className="impact-chip">
          <span className="impact-value">{insight.impactAssessment.usersAffected}</span>
          <span className="impact-key">users</span>
        </div>
        <div className="impact-chip">
          <span className="impact-value">{insight.impactAssessment.mttrEstimate}</span>
          <span className="impact-key">est. MTTR</span>
        </div>
        <div className="impact-chip impact-chip--services">
          {insight.impactAssessment.servicesImpacted.slice(0, 2).join(' · ')}
          {insight.impactAssessment.servicesImpacted.length > 2 && ` +${insight.impactAssessment.servicesImpacted.length - 2}`}
        </div>
      </div>

      {/* Correlations */}
      <div className="correlations">
        <div className="section-label">System Correlations</div>
        {insight.correlations.map((c, i) => (
          <div key={i} className="correlation-row">
            <span className={`corr-badge corr-badge--${c.system.toLowerCase()}`}>{c.system}</span>
            <span className="corr-event">{c.event}</span>
          </div>
        ))}
      </div>

      {/* Remediation steps */}
      <div className="remediation">
        <div className="section-label">Remediation Steps</div>
        {insight.remediationSteps.map(s => (
          <div key={s.step} className="remediation-step">
            <span className="step-num">{s.step}</span>
            <div className="step-body">
              <div className="step-action">{s.action}</div>
              <code className="step-command">{s.command}</code>
            </div>
            <button
              className={`step-btn ${s.safe ? 'step-btn--safe' : 'step-btn--unsafe'}`}
              onClick={() => onRemediate(insight.id, s.step)}
            >
              {s.safe ? 'Run' : 'Preview'}
            </button>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div className="feedback-row">
        <span className="feedback-label">Was this diagnosis helpful?</span>
        <button
          className={`feedback-btn ${insight.feedback === 'confirmed' ? 'feedback-btn--active-good' : ''}`}
          onClick={() => onFeedback(insight.id, 'confirmed')}
          disabled={insight.feedback !== null}
          title="Correct diagnosis"
        >👍</button>
        <button
          className={`feedback-btn ${insight.feedback === 'flagged' ? 'feedback-btn--active-bad' : ''}`}
          onClick={() => onFeedback(insight.id, 'flagged')}
          disabled={insight.feedback !== null}
          title="Incorrect diagnosis"
        >👎</button>
        {insight.feedback && (
          <span className="feedback-thanks">
            {insight.feedback === 'confirmed' ? 'Marked correct' : 'Flagged for review'}
          </span>
        )}
      </div>

    </div>
  )
}
