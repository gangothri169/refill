const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('rxresolve_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  getDemoUsers: () => apiRequest('/auth/demo-users'),
  demoLogin: (role: string) => apiRequest('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  login: (email: string, password?: string) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/auth/me'),

  // Cases
  getCases: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {}).toString();
    return apiRequest(`/cases${query ? `?${query}` : ''}`);
  },
  getCase: (id: string) => apiRequest(`/cases/${id}`),
  createCase: (data: any) => apiRequest('/cases', { method: 'POST', body: JSON.stringify(data) }),
  updateCaseStatus: (id: string, data: any) => apiRequest(`/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  assignCase: (id: string, data: any) => apiRequest(`/cases/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  providerDecision: (id: string, data: any) => apiRequest(`/cases/${id}/provider-decision`, { method: 'POST', body: JSON.stringify(data) }),
  getCaseTimeline: (id: string) => apiRequest(`/cases/${id}/timeline`),

  // AI & Copilot
  analyzeCaseAI: (id: string) => apiRequest(`/cases/${id}/ai/analyze`, { method: 'POST' }),
  summarizeCaseAI: (id: string) => apiRequest(`/cases/${id}/ai/summarize`, { method: 'POST' }),
  recommendActionAI: (id: string) => apiRequest(`/cases/${id}/ai/recommend`, { method: 'POST' }),
  copilotChat: (message: string, caseId?: string) => apiRequest('/ai/copilot/chat', { method: 'POST', body: JSON.stringify({ message, case_id: caseId }) }),
  draftMessage: (data: any) => apiRequest('/ai/draft-message', { method: 'POST', body: JSON.stringify(data) }),

  // Communications
  getCommunications: (caseId: string) => apiRequest(`/cases/${caseId}/communications`),
  sendMessage: (caseId: string, data: any) => apiRequest(`/cases/${caseId}/communications`, { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalytics: () => apiRequest('/analytics'),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {}).toString();
    return apiRequest(`/audit${query ? `?${query}` : ''}`);
  },

  // Integrations & Health
  getIntegrations: () => apiRequest('/integrations'),
  retryIntegration: (id: string) => apiRequest(`/integrations/${id}/retry`, { method: 'POST' }),
  toggleIntegrationFailure: (id: string) => apiRequest(`/integrations/${id}/toggle-failure`, { method: 'POST' }),
  getHealth: () => apiRequest('/health'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Knowledge Base
  getKnowledge: () => apiRequest('/knowledge'),
  searchKnowledge: (q: string) => apiRequest(`/knowledge/search?q=${encodeURIComponent(q)}`),
};
