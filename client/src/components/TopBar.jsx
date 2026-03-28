function TopBar({ farmers, selectedFarmerId, onSelectFarmer }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          🌱
        </span>
        <strong>KisanSahayak</strong>
      </div>

      <label className="farmer-switcher">
        <span className="sr-only">Select farmer</span>
        <select value={selectedFarmerId} onChange={(event) => onSelectFarmer(event.target.value)}>
          {farmers.map((farmer) => (
            <option key={farmer._id} value={farmer._id}>
              {farmer.name} ({farmer.phoneType})
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default TopBar;
