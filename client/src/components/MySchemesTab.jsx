function DocumentTags({ documents }) {
  return (
    <div className="doc-list">
      {documents.map((document) => (
        <span key={document} className="doc-tag">
          + {document}
        </span>
      ))}
    </div>
  );
}

function SchemeListCard({ scheme }) {
  const applyLink = scheme.applyLinks?.[0];

  return (
    <article className="my-scheme-card">
      <div className="my-scheme-head">
        <div>
          <h4>{scheme.title}</h4>
          <p className="benefit">{scheme.benefit}</p>
        </div>
        <span className="chip chip-soft">{scheme.category}</span>
      </div>

      <div className="doc-section-title">REQUIRED DOCUMENTS</div>
      <DocumentTags documents={scheme.requiredDocuments || []} />

      <div className="scheme-actions">
        <a className="btn btn-primary" href={applyLink?.url || "#"} target="_blank" rel="noreferrer">
          Apply Now
        </a>
        <button type="button" className="btn btn-outline">
          Guide Me
        </button>
      </div>
    </article>
  );
}

function MySchemesTab({ schemes }) {
  return (
    <section>
      <div className="section-muted-banner">Showing {schemes.length} schemes tailored to your profile.</div>
      <div className="my-schemes-list">
        {schemes.map((scheme) => (
          <SchemeListCard key={scheme._id} scheme={scheme} />
        ))}
      </div>
    </section>
  );
}

export default MySchemesTab;
