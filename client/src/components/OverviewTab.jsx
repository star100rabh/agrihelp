function SchemeOverviewCard({ scheme }) {
  return (
    <article className="scheme-overview-card">
      <div className="scheme-head">
        <span className="chip">{scheme.category}</span>
        <span className="arrow">→</span>
      </div>
      <h3>{scheme.title}</h3>
      <p className="benefit">{scheme.benefit}</p>
      <div className="meta-row">
        <span>Eligible</span>
        <span>{scheme.requiredDocuments.length} Docs Required</span>
      </div>
    </article>
  );
}

function ActionRequired({ applications }) {
  const pendingApp = applications.find((app) => app.status === "verification");
  if (!pendingApp) return null;

  return (
    <div className="action-required">
      <strong>Action Required</strong>
      <p>
        Your Aadhaar verification is pending for "{pendingApp.scheme.title}". Please visit your nearest
        CSC center with your physical Aadhaar card.
      </p>
    </div>
  );
}

export default function OverviewTab({ schemes, applications }) {
  return (
    <section className="tab-body">
      <header className="section-head">
        <h2>Priority Schemes for You</h2>
        <a href="#my-schemes">View All</a>
      </header>

      <div className="stacked-cards">
        {schemes.slice(0, 2).map((scheme) => (
          <SchemeOverviewCard key={scheme._id} scheme={scheme} />
        ))}
      </div>

      <ActionRequired applications={applications} />
    </section>
  );
}
