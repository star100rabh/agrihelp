function formatTime(isoDate) {
  if (!isoDate) return "--";
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AiVoiceTab({ farmer, callLogs, onStartCall }) {
  const latestTarget = callLogs[0]?.farmerName || farmer.name;

  return (
    <section className="tab-content">
      <div className="voice-hero">
        <div className="voice-icon">📞</div>
        <h2>AI Kisan Sahayak</h2>
        <p>
          This system automatically calls farmers who use keypad phones or are less
          tech-savvy to guide them through scheme applications.
        </p>
        <button type="button" className="btn-primary btn-large" onClick={onStartCall}>
          Start Outbound Call
        </button>
      </div>

      <h3 className="section-heading">Call Activity Log</h3>
      <div className="call-list">
        {callLogs.length === 0 && <p className="empty-state">No call logs available yet.</p>}
        {callLogs.map((call) => (
          <article className="call-item" key={call._id}>
            <div className="call-left">
              <span className="call-badge">📞</span>
              <div>
                <strong>{call.farmerName || latestTarget}</strong>
                <p>
                  {call.summary}
                  {call.applicationNumber ? ` Application: ${call.applicationNumber}.` : ""}
                </p>
              </div>
            </div>
            <span className="call-time">{formatTime(call.callAt || call.createdAt)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AiVoiceTab;
