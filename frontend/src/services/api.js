/**
 * ContinuityOS AI API Client
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('continuityos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    register: async (data) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    demoLogin: async () => {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
  },

  // Documents
  documents: {
    list: async () => {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    upload: async (file, autoAnalyze = true) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/documents/upload?auto_analyze=${autoAnalyze}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    getDownloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
  },

  // Structured Analysis
  analysis: {
    analyze: async (docId) => {
      const res = await fetch(`${API_BASE}/analysis/analyze/${docId}`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    getByDocument: async (docId) => {
      const res = await fetch(`${API_BASE}/analysis/document/${docId}`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    getAll: async () => {
      const res = await fetch(`${API_BASE}/analysis/all`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_BASE}/analysis/stats`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
  },

  // Knowledge Gaps
  gaps: {
    getSummary: async () => {
      const res = await fetch(`${API_BASE}/gaps/summary`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
  },

  // AI Knowledge Assistant (Chat)
  chat: {
    ask: async (question, documentIds = null) => {
      const res = await fetch(`${API_BASE}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ question, document_ids: documentIds }),
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/chat/history`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    clear: async () => {
      const res = await fetch(`${API_BASE}/chat/clear`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
  },

  // Handover Reports
  reports: {
    generate: async (payload) => {
      const res = await fetch(`${API_BASE}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    list: async () => {
      const res = await fetch(`${API_BASE}/reports`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    getPdfUrl: (id) => `${API_BASE}/reports/${id}/pdf`,
  },

  // Audit Logs
  audit: {
    list: async () => {
      const res = await fetch(`${API_BASE}/audit-logs`, {
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
  },

  // System
  system: {
    getStatus: async () => {
      const res = await fetch(`${API_BASE}/system/status`);
      return handleResponse(res);
    },
    seed: async () => {
      const res = await fetch(`${API_BASE}/system/seed`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      return handleResponse(res);
    },
    updateApiKey: async (apiKey) => {
      const formData = new FormData();
      formData.append('api_key', apiKey);
      const res = await fetch(`${API_BASE}/system/update-api-key`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      return handleResponse(res);
    },
  },
};

