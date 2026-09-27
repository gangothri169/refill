import {
  DEMO_USERS,
  INITIAL_CASES,
  DEMO_ANALYTICS,
  DEMO_AUDIT_LOGS,
  DEMO_INTEGRATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_KNOWLEDGE_DOCUMENTS
} from './mockData';
import { RefillCase, AuditLogItem } from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '/api';

// --- Local Storage Stateful Mock Store ---
const STORAGE_KEY_CASES = 'rxresolve_mock_cases';
const STORAGE_KEY_AUDITS = 'rxresolve_mock_audits';

function getStoredCases(): RefillCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASES);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(INITIAL_CASES));
  return INITIAL_CASES;
}

function saveStoredCases(cases: RefillCase[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  } catch {}
}

function getStoredAudits(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDITS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(DEMO_AUDIT_LOGS));
  return DEMO_AUDIT_LOGS;
}

function saveStoredAudits(audits: AuditLogItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(audits));
  } catch {}
}

// Fallback Mock API Handler
function handleMockRequest(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/api/, '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth
  if (cleanEndpoint === '/auth/demo-users') {
    return DEMO_USERS;
  }
  if (cleanEndpoint === '/auth/demo-login') {
    const user = DEMO_USERS.find((u) => u.role === body.role) || DEMO_USERS[1];
    return {
      access_token: `demo-token-${user.id}`,
      token_type: 'bearer',
      user
    };
  }
  if (cleanEndpoint === '/auth/login') {
    const user = DEMO_USERS.find((u) => u.email === body.email) || DEMO_USERS[1];
    return {
      access_token: `demo-token-${user.id}`,
      token_type: 'bearer',
      user
    };
  }
  if (cleanEndpoint === '/auth/me') {
    return DEMO_USERS[1];
  }

  // Cases List
  if (cleanEndpoint.startsWith('/cases') && method === 'GET') {
    const idMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)$/);
    if (idMatch) {
      const caseId = idMatch[1];
      const cases = getStoredCases();
      const found = cases.find((c) => c.id === caseId);
      if (found) return found;
      return cases[0]; // fallback
    }

    const timelineMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/timeline$/);
    if (timelineMatch) {
      return [
        {
          id: 'evt-01',
          action: 'SUBMIT_REFILL_REQUEST',
          note: 'Submitted via Surescripts portal.',
          timestamp: new Date().toISOString()
        }
      ];
    }

    const commsMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/communications$/);
    if (commsMatch) {
      return [
        {
          id: 'comm-01',
          sender_name: 'Elena Rostova, CPhT',
          sender_role: 'PHARMACY_STAFF',
          content: '0 refills remain on original Rx. Patient has 2 doses left at home.',
          timestamp: new Date().toISOString()
        }
      ];
    }

    // List cases
    let cases = getStoredCases();
    return cases;
  }

  // Create Case
  if (cleanEndpoint === '/cases' && method === 'POST') {
    const cases = getStoredCases();
    const newId = `RX-${10500 + cases.length}`;
    const newCase: RefillCase = {
      id: newId,
      patient_id: `pat-${Date.now()}`,
      patient_name: body.patient_name || 'New Patient',
      patient_dob: body.patient_dob || '1985-01-01',
      patient_phone: '555-019-2041',
      medication_id: `med-${Date.now()}`,
      medication_name: body.medication_name || 'Maintenance Rx',
      dosage: body.dosage || '10mg Daily',
      quantity: body.quantity || 30,
      days_supply: body.days_supply || 30,
      refills_requested: 1,
      refills_remaining: body.refills_remaining ?? 0,
      pharmacy_id: 'org-pharm-01',
      pharmacy_name: body.pharmacy_name || 'Downtown Pharmacy',
      practice_id: 'org-pract-01',
      practice_name: body.practice_name || 'Downtown Physician Group',
      provider_id: 'usr-prov-01',
      provider_name: body.provider_name || 'Dr. Sarah Wilson',
      status: 'TRIAGING',
      blocker: body.force_blocker || 'No refills remaining',
      blocker_category: 'Provider-related',
      priority: 'HIGH',
      priority_score: 75,
      required_next_action: 'Provider review required',
      sla_hours_remaining: 24.0,
      sla_status: 'HEALTHY',
      information_completeness: {
        patient_info: true,
        medication_info: true,
        pharmacy_info: true,
        prescription_details: true,
        provider_info: true,
        required_review_completed: false
      },
      ai_analysis: {
        blocker: body.force_blocker || 'No refills remaining',
        category: 'Provider-related',
        confidence: 0.94,
        recommended_action: 'Route to physician practice for provider review.',
        recommended_role: 'PROVIDER',
        operational_priority: 'HIGH',
        reasoning: 'Existing prescription has 0 refills remaining. Provider sign-off required under SOP §4.2.',
        summary: 'Refill request submitted. Refills exhausted. Provider sign-off needed.'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    cases.unshift(newCase);
    saveStoredCases(cases);
    return newCase;
  }

  // Provider Decision
  if (cleanEndpoint.includes('/provider-decision') && method === 'POST') {
    const idMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/provider-decision$/);
    const caseId = idMatch ? idMatch[1] : '';
    const cases = getStoredCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx !== -1) {
      if (body.decision === 'APPROVE') {
        cases[idx].status = 'ACTION_REQUIRED';
        cases[idx].required_next_action = 'Approved by provider; dispatching electronic prescription';
      } else if (body.decision === 'REQUIRE_VISIT') {
        cases[idx].status = 'WAITING_FOR_INFORMATION';
        cases[idx].required_next_action = 'Clinic encounter required before renewal';
      } else if (body.decision === 'REQUEST_INFO') {
        cases[idx].status = 'WAITING_FOR_INFORMATION';
        cases[idx].required_next_action = body.notes || 'Additional clinical info requested';
      } else {
        cases[idx].status = 'CANCELLED';
      }
      cases[idx].updated_at = new Date().toISOString();
      saveStoredCases(cases);
      return cases[idx];
    }
    return { success: true };
  }

  // Status Update
  if (cleanEndpoint.includes('/status') && method === 'PATCH') {
    return { success: true };
  }

  // Analytics
  if (cleanEndpoint === '/analytics') {
    return DEMO_ANALYTICS;
  }

  // Audit Logs
  if (cleanEndpoint.startsWith('/audit')) {
    return getStoredAudits();
  }

  // Integrations & Health
  if (cleanEndpoint === '/integrations') {
    return DEMO_INTEGRATIONS;
  }
  if (cleanEndpoint.includes('/retry') && method === 'POST') {
    return { success: true, message: 'Retry initiated' };
  }
  if (cleanEndpoint.includes('/toggle-failure') && method === 'POST') {
    return { success: true };
  }
  if (cleanEndpoint === '/health') {
    return { status: 'HEALTHY', demo_mode: true, subsystems: { api: { status: 'HEALTHY' }, database: { status: 'HEALTHY' } } };
  }

  // Notifications
  if (cleanEndpoint === '/notifications') {
    return DEMO_NOTIFICATIONS;
  }
  if (cleanEndpoint.includes('/read')) {
    return { success: true };
  }

  // Knowledge Base
  if (cleanEndpoint.startsWith('/knowledge')) {
    return { documents: DEMO_KNOWLEDGE_DOCUMENTS, total: DEMO_KNOWLEDGE_DOCUMENTS.length };
  }

  // Copilot Chat
  if (cleanEndpoint === '/ai/copilot/chat') {
    const msg = (body.message || '').toLowerCase();
    let ans = `I am analyzing your query regarding the refill workflow. `;
    if (msg.includes('why') || msg.includes('stuck') || msg.includes('block')) {
      ans = `This refill is currently stuck because **0 refills remain** on the original prescription. Under Practice SOP §4.2, automated re-authorization is restricted and requires provider review and sign-off.`;
    } else if (msg.includes('who') || msg.includes('act')) {
      ans = `The attending physician **Dr. Sarah Wilson** needs to act next. They can authorize the renewal or require an annual encounter.`;
    } else if (msg.includes('missing')) {
      ans = `Patient demographics and medication details are 100% verified. No clinical data is missing; only human provider authorization is pending.`;
    } else {
      ans = `RxResolve AI classifies this case with 94% confidence. Practice SOP §4.2 applies. Routing to provider queue recommended.`;
    }
    return {
      answer: ans,
      confidence: 0.94,
      recommended_next_step: 'Provider renewal authorization',
      sources: [
        {
          source: 'Practice Refill SOP §4.2',
          title: 'Zero Refills Remaining Renewal Protocol',
          category: 'Practice SOPs'
        }
      ]
    };
  }

  return {};
}

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

  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${base}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.ok) {
      return await res.json();
    }
    // If response was not ok (e.g. 404 from Vercel without backend), fallback
    console.warn(`[API] Endpoint ${url} returned ${res.status}. Falling back to demo state.`);
    return handleMockRequest(endpoint, options);
  } catch (err) {
    // Network failure (no backend reachable) -> Seamlessly fallback to demo mock engine!
    console.warn(`[API] Could not reach ${url}. Running in seamless offline demo mode.`);
    return handleMockRequest(endpoint, options);
  }
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
