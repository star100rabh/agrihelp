function StatCard({ value, label }) {
  return (
    <article className="stat-card">
      <h3>{value}</h3>
      <p>{label}</p>
    </article>
  );
}

function formatLocation(location) {
  if (!location) return "-";
  return [location.district, location.state].filter(Boolean).join(", ");
}

export default function FarmerSidebar({ farmer, stats }) {
  const phoneLabel =
    farmer?.phoneType === "smartphone" ? "SMARTPHONE USER" : "KEYPAD USER";
  return (
    <aside className="farmer-sidebar">
      <div className="farmer-profile-card">
        <div className="farmer-avatar" aria-hidden="true">
          <span>👤</span>
        </div>
        <h2>{farmer?.name || "Farmer Name"}</h2>
        <p className="farmer-location">{formatLocation(farmer?.location)}</p>

        <div className="farmer-meta-grid">
          <div className="meta-box">
            <span>Land Area</span>
            <strong>{farmer?.landAreaHectare ?? 0} Hectares</strong>
          </div>
          <div className="meta-box">
            <span>Primary Crops</span>
            <strong>{farmer?.crops?.slice(0, 2).join(", ") || "-"}</strong>
          </div>
        </div>

        <div className="phone-tag">{phoneLabel}</div>
      </div>

      <div className="stat-grid">
        <StatCard value={stats?.eligibleSchemes ?? 0} label="ELIGIBLE SCHEMES" />
        <StatCard value={stats?.activeApplications ?? 0} label="ACTIVE APPS" />
      </div>
    </aside>
  );
}
