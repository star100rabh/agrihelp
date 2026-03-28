import { useEffect, useMemo, useState } from "react";
import "./App.css";
import TopBar from "./components/TopBar";
import Tabs from "./components/Tabs";
import FarmerSidebar from "./components/FarmerSidebar";
import OverviewTab from "./components/OverviewTab";
import MySchemesTab from "./components/MySchemesTab";
import AiVoiceTab from "./components/AiVoiceTab";
import TrackingTab from "./components/TrackingTab";
import { fallbackDashboard } from "./constants/fallbackData";
import {
  createVoiceCallLog,
  fetchDashboard,
  fetchFarmers,
} from "./api/dashboardApi";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [farmers, setFarmers] = useState([
    {
      _id: fallbackDashboard.farmer._id,
      name: fallbackDashboard.farmer.name,
      phoneType: fallbackDashboard.farmer.phoneType || "smartphone",
    },
  ]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(fallbackDashboard.farmer._id);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const prioritizedSchemes = useMemo(
    () => (dashboard.prioritizedSchemes || []).slice(0, 4),
    [dashboard],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const farmersData = await fetchFarmers();
        if (cancelled) return;

        if (farmersData.length) {
          setFarmers(farmersData);
          setSelectedFarmerId(farmersData[0]._id);
        }
        setError("");
      } catch (fetchError) {
        if (cancelled) return;

        setFarmers([
          {
            _id: fallbackDashboard.farmer._id,
            name: fallbackDashboard.farmer.name,
            phoneType: fallbackDashboard.farmer.phoneType || "smartphone",
          },
        ]);
        setSelectedFarmerId(fallbackDashboard.farmer._id);
        setError("Using local demo data because API is unavailable.");
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped || !selectedFarmerId) return;
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      try {
        const data = await fetchDashboard(selectedFarmerId);
        if (!cancelled) {
          setDashboard(data);
          setError("");
        }
      } catch (_error) {
        if (!cancelled) {
          setDashboard(fallbackDashboard);
          setError("Using local demo data because API is unavailable.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, selectedFarmerId]);

  async function handleStartCall() {
    const bestScheme = prioritizedSchemes[0];
    if (!bestScheme || !dashboard?.farmer?._id) return;

    const payload = {
      farmerId: dashboard.farmer._id,
      summary: `Explained ${bestScheme.title} benefits, documents, deadlines, and apply options.`,
      nextAction: "Follow-up in 5 days to collect application number.",
      type: "outbound",
      status: "completed",
    };

    try {
      const result = await createVoiceCallLog(payload);
      setDashboard((previous) => ({
        ...previous,
        callLogs: [result.callLog, ...(previous.callLogs || [])],
      }));
    } catch (_error) {
      const localLog = {
        _id: `local-call-${Date.now()}`,
        farmer: dashboard.farmer._id,
        farmerName: dashboard.farmer.name,
        callType: "outbound",
        status: "completed",
        summary: payload.summary,
        nextAction: payload.nextAction,
        callAt: new Date().toISOString(),
      };
      setDashboard((previous) => ({
        ...previous,
        callLogs: [localLog, ...(previous.callLogs || [])],
      }));
    }
  }

  return (
    <div className="page">
      <TopBar
        farmers={farmers}
        selectedFarmerId={selectedFarmerId}
        onSelectFarmer={setSelectedFarmerId}
      />

      <main className="layout">
        <FarmerSidebar farmer={dashboard.farmer} stats={dashboard.stats} />

        <section className="content">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {error ? <div className="error-banner">{error}</div> : null}
          {loading ? <div className="loading">Loading dashboard...</div> : null}

          {!loading && activeTab === "overview" ? (
            <OverviewTab schemes={prioritizedSchemes} applications={dashboard.applications || []} />
          ) : null}

          {!loading && activeTab === "schemes" ? (
            <MySchemesTab schemes={prioritizedSchemes} />
          ) : null}

          {!loading && activeTab === "voice" ? (
            <AiVoiceTab
              farmer={dashboard.farmer}
              callLogs={dashboard.callLogs || []}
              onStartCall={handleStartCall}
            />
          ) : null}

          {!loading && activeTab === "tracking" ? (
            <TrackingTab applications={dashboard.applications || []} />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
