import { useEffect, useMemo, useState } from "react";
import "./App.css";
import TopBar from "./components/TopBar";
import Tabs from "./components/Tabs";
import FarmerSidebar from "./components/FarmerSidebar";
import OverviewTab from "./components/OverviewTab";
import MySchemesTab from "./components/MySchemesTab";
import AiVoiceTab from "./components/AiVoiceTab";
import TrackingTab from "./components/TrackingTab";
import AdminTab from "./components/AdminTab";
import { fallbackDashboard } from "./constants/fallbackData";
import {
  fetchAdminUsers,
  triggerAdminCall,
  sendAdminWhatsApp,
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
  const [adminUsers, setAdminUsers] = useState({ smartphoneUsers: [], keypadUsers: [] });
  const [adminLoading, setAdminLoading] = useState(true);
  const [callingUserId, setCallingUserId] = useState("");
  const [followUpUserId, setFollowUpUserId] = useState("");
  const [whatsappSendingUserId, setWhatsappSendingUserId] = useState("");

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

  useEffect(() => {
    if (!bootstrapped) return;
    let cancelled = false;

    async function loadAdminUsers() {
      setAdminLoading(true);
      try {
        const data = await fetchAdminUsers();
        if (!cancelled) {
          setAdminUsers(data);
        }
      } catch (_error) {
        if (!cancelled) {
          setAdminUsers({
            smartphoneUsers: [
              {
                _id: fallbackDashboard.farmer._id,
                name: fallbackDashboard.farmer.name,
                phoneNo: fallbackDashboard.farmer.phoneNo,
                phoneType: fallbackDashboard.farmer.phoneType,
                smartphoneProficiency: fallbackDashboard.farmer.smartphoneProficiency,
                location: fallbackDashboard.farmer.location,
                schemes: (fallbackDashboard.prioritizedSchemes || []).slice(0, 3),
                callStatus: {
                  hasBeenCalled: false,
                  lastCallType: null,
                  lastCallAt: null,
                  requiresFollowUp: false,
                  followUpAt: null,
                },
              },
            ],
            keypadUsers: [],
          });
        }
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    }

    loadAdminUsers();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, dashboard.callLogs]);

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

  async function handleAdminCall(user, mode = "outbound") {
    const targetFarmerId = user._id;
    const modeKey = mode === "follow_up" ? "follow_up" : "outbound";
    if (!targetFarmerId) return;

    if (modeKey === "follow_up") {
      setFollowUpUserId(targetFarmerId);
    } else {
      setCallingUserId(targetFarmerId);
    }

    const topScheme = user.schemes?.[0];
    const modeLabel = mode === "follow_up" ? "follow-up" : "outbound";
    const summary =
      mode === "follow_up"
        ? "Follow-up call completed. Asked if farmer applied and requested application number."
        : `AI ${modeLabel} call completed. Explained ${
            topScheme?.title || "eligible schemes"
          }, benefits, deadlines, and required documents.`;

    try {
      await triggerAdminCall({ farmerId: targetFarmerId, type: modeKey });
    } catch (_error) {
      // Ignore in UI-only fallback mode.
    } finally {
      try {
        const refreshed = await fetchAdminUsers();
        setAdminUsers(refreshed);
      } catch (_refreshError) {
        setAdminUsers((previous) => {
          const updatedKeypad = (previous.keypadUsers || []).map((item) => {
            if (item._id !== targetFarmerId) return item;
            return {
              ...item,
              callStatus: {
                hasBeenCalled: true,
                lastCallType: mode,
                lastCallAt: new Date().toISOString(),
                requiresFollowUp: mode === "outbound",
                followUpAt:
                  mode === "outbound"
                    ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
                    : item.callStatus?.followUpAt || null,
              },
            };
          });
          return {
            ...previous,
            keypadUsers: updatedKeypad,
          };
        });
      }
      setCallingUserId((current) => (current === targetFarmerId ? "" : current));
      setFollowUpUserId((current) => (current === targetFarmerId ? "" : current));
    }
  }

  async function handleAdminWhatsApp(user, fallbackUrlFromUi = "") {
    if (!user?._id) return;
    setWhatsappSendingUserId(user._id);
    try {
      const response = await sendAdminWhatsApp(user._id);
      const targetUrl = response?.waUrl || fallbackUrlFromUi;
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (_error) {
      if (fallbackUrlFromUi) {
        window.open(fallbackUrlFromUi, "_blank", "noopener,noreferrer");
      }
    } finally {
      setWhatsappSendingUserId((current) => (current === user._id ? "" : current));
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

          {activeTab === "admin" ? (
            <AdminTab
              data={adminUsers}
              loading={adminLoading}
              onStartAiCall={(user) => handleAdminCall(user, "outbound")}
              onFollowUpCall={(user) => handleAdminCall(user, "follow_up")}
              callLoadingUserId={callingUserId}
              followUpLoadingUserId={followUpUserId}
              onWhatsApp={handleAdminWhatsApp}
              whatsappLoadingUserId={whatsappSendingUserId}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
