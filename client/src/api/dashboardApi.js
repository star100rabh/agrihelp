const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function fetchFarmers() {
  const response = await fetch(`${API_BASE_URL}/farmers`);
  if (!response.ok) {
    throw new Error("Failed to fetch farmers");
  }

  const data = await response.json();
  return data.farmers || [];
}

export async function fetchDashboard(farmerId) {
  const response = await fetch(`${API_BASE_URL}/dashboard/${farmerId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return response.json();
}

export async function createVoiceCallLog(payload) {
  const response = await fetch(`${API_BASE_URL}/voice/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create call log");
  }

  return response.json();
}

export async function fetchAdminUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/users`);
  if (!response.ok) {
    throw new Error("Failed to fetch admin users");
  }

  return response.json();
}

export async function triggerAdminCall(farmerId, type = "outbound") {
  const response = await fetch(`${API_BASE_URL}/admin/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      farmerId,
      type,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to trigger admin AI call");
  }
  return response.json();
}

export async function sendAdminWhatsApp(farmerId) {
  const response = await fetch(`${API_BASE_URL}/admin/whatsapp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      farmerId,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to prepare WhatsApp message");
  }
  return response.json();
}
