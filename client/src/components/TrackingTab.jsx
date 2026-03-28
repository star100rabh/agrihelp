function statusLabel(status) {
  if (!status) return "";
  const normalized = String(status).toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "verification") return "Verification";
  if (normalized === "disbursed") return "Disbursed";
  return "In Progress";
}

function TrackingTab({ applications }) {
  const current = applications?.[0];

  if (!current) {
    return (
      <section className="panel">
        <h2 className="panel-title">Track Active Applications</h2>
        <div className="empty-state">No active applications found yet.</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Track Active Applications</h2>
      <article className="tracking-card">
        <header className="tracking-header">
          <div>
            <h3>{current.scheme?.title || current.schemeId?.title || "Scheme"}</h3>
            <p>ID: {current.applicationNumber}</p>
          </div>
          <span className="status-badge green">{statusLabel(current.status)}</span>
        </header>

        <div className="timeline">
          {(current.timeline || []).map((step, index) => (
            <div className="timeline-step" key={`${step.step}-${index}`}>
              <div className={`dot ${step.status === "completed" ? "done" : ""}`}>{index + 1}</div>
              <div className="timeline-meta">
                <strong>{step.step}</strong>
                <span>{step.dateLabel || "TBD"}</span>
              </div>
            </div>
          ))}
        </div>

        {current.receiptUrl ? (
          <div className="receipt-row">
            <div className="receipt-file">Application Receipt.pdf</div>
            <a href={current.receiptUrl} target="_blank" rel="noreferrer">
              DOWNLOAD
            </a>
          </div>
        ) : null}
      </article>

      <div className="track-add-card">
        <div className="plus-circle">+</div>
        <h4>Add an existing Application Number</h4>
        <p>If you applied via CSC, add it here to track.</p>
      </div>
    </section>
  );
}

export default TrackingTab;
