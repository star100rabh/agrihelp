const tabs = [
  { key: "overview", label: "Overview" },
  { key: "schemes", label: "My Schemes" },
  { key: "voice", label: "AI Voice" },
  { key: "tracking", label: "Tracking" },
];

function Tabs({ activeTab, setActiveTab }) {

  return (
    <div className="tabs-card">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
