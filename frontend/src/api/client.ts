import {
  DEMO_USERS,
  INITIAL_CASES,
  DEMO_ANALYTICS,
  DEMO_AUDIT_LOGS,
  DEMO_INTEGRATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_KNOWLEDGE_DOCUMENTS
} from './mockData';
import { RefillCase, AuditLogItem, IntegrationServiceItem } from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '/api';

// --- Local Storage Stateful Mock Store ---
const STORAGE_KEY_CASES = 'rxresolve_mock_cases';
const STORAGE_KEY_AUDITS = 'rxresolve_mock_audits';
const STORAGE_KEY_INTEGRATIONS = 'rxresolve_mock_integrations';

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

function getStoredIntegrations(): IntegrationServiceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTEGRATIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(DEMO_INTEGRATIONS));
  return DEMO_INTEGRATIONS;
}

function saveStoredIntegrations(items: IntegrationServiceItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(items));
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

    // Append Audit Log for case creation
    const audits = getStoredAudits();
    audits.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      case_id: newId,
      actor_type: 'HUMAN',
      actor_id: 'usr-pharm-01',
      actor_name: 'Elena Rostova, CPhT',
      actor_role: 'PHARMACY_STAFF',
      action: 'CREATE_REFILL_CASE',
      event_type: 'CASE_CREATION',
      previous_state: undefined,
      new_state: 'TRIAGING',
      confidence: 1.0,
      details: { patient: newCase.patient_name, medication: newCase.medication_name, blocker: newCase.blocker }
    });
    saveStoredAudits(audits);

    return newCase;
  }

  // Provider Decision
  if (cleanEndpoint.includes('/provider-decision') && method === 'POST') {
    const idMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/provider-decision$/);
    const caseId = idMatch ? idMatch[1] : '';
    const cases = getStoredCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx !== -1) {
      const prevStatus = cases[idx].status;
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

      // Append Audit Log for provider determination
      const audits = getStoredAudits();
      audits.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        case_id: caseId,
        actor_type: 'HUMAN',
        actor_id: 'usr-prov-01',
        actor_name: 'Dr. Sarah Wilson, MD',
        actor_role: 'PROVIDER',
        action: body.decision === 'APPROVE' ? 'AUTHORIZE_RENEWAL' : 'PROVIDER_DECISION',
        event_type: 'WORKFLOW_TRANSITION',
        previous_state: prevStatus,
        new_state: cases[idx].status,
        confidence: 1.0,
        details: { decision: body.decision, notes: body.notes || 'Provider clinical determination recorded' }
      });
      saveStoredAudits(audits);

      return cases[idx];
    }
    return { success: true };
  }

  // Case Assignment
  if (cleanEndpoint.includes('/assign') && method === 'POST') {
    const idMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/assign$/);
    const caseId = idMatch ? idMatch[1] : '';
    const cases = getStoredCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx !== -1) {
      cases[idx].owner_name = body.assignee_name || 'Dr. Sarah Wilson';
      cases[idx].owner_role = body.assignee_role || 'PROVIDER';
      cases[idx].status = 'WAITING_FOR_PROVIDER';
      cases[idx].updated_at = new Date().toISOString();
      saveStoredCases(cases);
    }
    return { success: true };
  }

  // Communications Post
  if (cleanEndpoint.includes('/communications') && method === 'POST') {
    return {
      id: `comm-${Date.now()}`,
      sender_name: 'Care Coordinator',
      sender_role: body.sender_role || 'PRACTICE_STAFF',
      content: body.content || '',
      timestamp: new Date().toISOString()
    };
  }

  // AI Message Draft
  if (cleanEndpoint === '/ai/draft-message' && method === 'POST') {
    return {
      subject: `Prescription Refill Inquiry: ${body.case_id || 'Refill Request'}`,
      body: `Hello Care Team,\n\nFollowing up regarding the refill request for ${body.case_id || 'this patient'}. The prescription indicates zero refills remaining. Recent clinical monitoring is documented. Please review and authorize the renewal.\n\nThank you,\nClinical Operations`
    };
  }

  // Status Update
  if (cleanEndpoint.includes('/status') && method === 'PATCH') {
    const idMatch = cleanEndpoint.match(/^\/cases\/([A-Za-z0-9_-]+)\/status$/);
    const caseId = idMatch ? idMatch[1] : '';
    const cases = getStoredCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx !== -1 && body.new_status) {
      cases[idx].status = body.new_status;
      if (body.required_next_action) cases[idx].required_next_action = body.required_next_action;
      cases[idx].updated_at = new Date().toISOString();
      saveStoredCases(cases);
    }
    return { success: true };
  }

  // Analytics
  if (cleanEndpoint === '/analytics') {
    return DEMO_ANALYTICS;
  }

  // Audit Logs - with complete dynamic parameter filtering
  if (cleanEndpoint.startsWith('/audit')) {
    let logs = getStoredAudits();

    try {
      const urlObj = new URL('http://local' + (endpoint.startsWith('/') ? endpoint : '/' + endpoint));
      const fCaseId = urlObj.searchParams.get('case_id')?.trim().toLowerCase();
      const fActor = urlObj.searchParams.get('actor_type')?.trim().toUpperCase();
      const fEvent = urlObj.searchParams.get('event_type')?.trim().toUpperCase();
      const fSearch = urlObj.searchParams.get('search')?.trim().toLowerCase();

      if (fCaseId) {
        logs = logs.filter((l) => (l.case_id || '').toLowerCase().includes(fCaseId));
      }
      if (fActor && fActor !== 'ALL') {
        logs = logs.filter((l) => (l.actor_type || '').toUpperCase() === fActor);
      }
      if (fEvent && fEvent !== 'ALL') {
        logs = logs.filter((l) => (l.event_type || '').toUpperCase() === fEvent);
      }
      if (fSearch) {
        logs = logs.filter((l) =>
          (l.action || '').toLowerCase().includes(fSearch) ||
          (l.actor_name || '').toLowerCase().includes(fSearch) ||
          (l.case_id || '').toLowerCase().includes(fSearch) ||
          JSON.stringify(l.details || {}).toLowerCase().includes(fSearch)
        );
      }
    } catch {}

    return logs;
  }

  // Integrations & Health - Stateful with local storage
  if (cleanEndpoint === '/integrations') {
    return getStoredIntegrations();
  }

  // Retry degraded integration bridge -> immediately recovers to HEALTHY
  if (cleanEndpoint.includes('/retry') && method === 'POST') {
    const idMatch = cleanEndpoint.match(/^\/integrations\/([A-Za-z0-9_-]+)\/retry$/);
    const intId = idMatch ? idMatch[1] : '';
    const items = getStoredIntegrations();
    const idx = items.findIndex((i) => i.id === intId);
    if (idx !== -1) {
      items[idx].status = 'HEALTHY';
      items[idx].simulate_failure = false;
      delete items[idx].last_error;
      items[idx].latency_ms = Math.floor(Math.random() * 30) + 25;
      items[idx].success_rate = 99.8;
      items[idx].last_sync = new Date().toISOString();
      saveStoredIntegrations(items);

      // Append Audit Log for resilience testing
      const audits = getStoredAudits();
      audits.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor_type: 'HUMAN',
        actor_id: 'usr-admin-01',
        actor_name: 'Marcus Vance',
        actor_role: 'ADMIN',
        action: 'INTEGRATION_RECOVERY',
        event_type: 'INTEGRATION_RECOVERY',
        confidence: 1.0,
        details: { integration: items[idx].name, status: 'Recovered to HEALTHY status via automated retry' }
      });
      saveStoredAudits(audits);
    }
    return { success: true, message: 'Gateway recovered' };
  }

  // Toggle simulated failure on integration bridge
  if (cleanEndpoint.includes('/toggle-failure') && method === 'POST') {
    const idMatch = cleanEndpoint.match(/^\/integrations\/([A-Za-z0-9_-]+)\/toggle-failure$/);
    const intId = idMatch ? idMatch[1] : '';
    const items = getStoredIntegrations();
    const idx = items.findIndex((i) => i.id === intId);
    if (idx !== -1) {
      const isNowDegraded = items[idx].status === 'HEALTHY';
      items[idx].status = isNowDegraded ? 'DEGRADED' : 'HEALTHY';
      items[idx].simulate_failure = isNowDegraded;
      if (isNowDegraded) {
        items[idx].last_error = 'Gateway timeout on transaction 278-PA-9921 (PBM timeout)';
        items[idx].latency_ms = 1420;
        items[idx].success_rate = 84.6;
      } else {
        delete items[idx].last_error;
        items[idx].latency_ms = Math.floor(Math.random() * 40) + 30;
        items[idx].success_rate = 99.9;
      }
      items[idx].last_sync = new Date().toISOString();
      saveStoredIntegrations(items);
    }
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

  // Knowledge Base - Supports both listing and keyword search
  if (cleanEndpoint.startsWith('/knowledge')) {
    if (cleanEndpoint.includes('/search')) {
      try {
        const urlObj = new URL('http://local' + (endpoint.startsWith('/') ? endpoint : '/' + endpoint));
        const q = (urlObj.searchParams.get('q') || '').toLowerCase().trim();
        if (!q) return DEMO_KNOWLEDGE_DOCUMENTS;
        return DEMO_KNOWLEDGE_DOCUMENTS.filter((d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.keywords?.some((k) => k.toLowerCase().includes(q))
        );
      } catch {
        return DEMO_KNOWLEDGE_DOCUMENTS;
      }
    }
    return DEMO_KNOWLEDGE_DOCUMENTS;
  }

  // Copilot Chat - Dynamic Case-Aware NLP Engine
  if (cleanEndpoint === '/ai/copilot/chat') {
    const msg = (body.message || '').toLowerCase();
    const cases = getStoredCases();
    const activeCase = (body.case_id ? cases.find((c) => c.id === body.case_id) : null) || cases[0];
    const patient = activeCase?.patient_name || 'Alex Johnson';
    const med = activeCase?.medication_name || 'Demo Medication 10mg';
    const dosage = activeCase?.dosage || '10mg PO Daily';
    const blocker = activeCase?.blocker || 'No refills remaining';
    const category = activeCase?.blocker_category || 'Provider-related';
    const owner = activeCase?.owner_name || 'Dr. Sarah Wilson';
    const ownerRole = (activeCase?.owner_role || 'PROVIDER').replace('_', ' ');
    const sla = activeCase?.sla_hours_remaining ?? 18.0;
    const cid = activeCase?.id || 'RX-10482';

    let ans = '';
    let sources = [
      {
        source: 'Practice SOP §4.2',
        title: 'Zero Refills Remaining Renewal Protocol',
        category: 'Practice SOPs'
      }
    ];

    if (msg.includes('why') || msg.includes('stuck') || msg.includes('block') || msg.includes('reason') || msg.includes('delay')) {
      ans = `### Operational Root Cause for **${cid}**\n\n` +
        `• **Primary Blocker:** **${blocker}** (${category})\n` +
        `• **Patient:** ${patient} (${med} ${dosage})\n` +
        `• **Why it's on hold:** The prescription has zero refills remaining. Under **Practice SOP §4.2**, care coordinators cannot independently re-authorize this maintenance medication without physician evaluation.\n` +
        `• **SLA Clock:** **${sla}h remaining** before compliance threshold.`;
    } else if (msg.includes('who') || msg.includes('act') || msg.includes('owner') || msg.includes('responsib')) {
      ans = `### Current Ownership for **${cid}**\n\n` +
        `• **Responsible Person:** **${owner}** (${ownerRole})\n` +
        `• **Required Action:** Clinical sign-off and authorization of 3 refills (90-day supply).\n` +
        `• **If Provider is unavailable:** Maya Lin (Practice Staff) can reroute to covering physician or offer a 30-day bridging refill if an annual visit is scheduled.`;
      sources = [
        {
          source: 'Practice SOP §6.1',
          title: 'Covering Provider & Urgent Escalation Protocol',
          category: 'Practice SOPs'
        }
      ];
    } else if (msg.includes('missing') || msg.includes('complet') || msg.includes('info') || msg.includes('lack')) {
      ans = `### Information Completeness Check for **${cid}**\n\n` +
        `• ✓ **Patient Demographics:** Verified (${patient}, DOB: ${activeCase?.patient_dob || '1988-04-14'})\n` +
        `• ✓ **Medication & Strength:** Verified (${med}, ${dosage})\n` +
        `• ✓ **Pharmacy Routing:** Verified (${activeCase?.pharmacy_name || 'Downtown Pharmacy'})\n` +
        `• ✓ **Clinical Chart History:** Encounters within last 6 months documented\n` +
        `• ⚠ **Pending Item:** Provider electronic sign-off is the sole remaining requirement.`;
    } else if (msg.includes('next') || msg.includes('recommend') || msg.includes('step') || msg.includes('what should')) {
      ans = `### Recommended Next Workflow Steps for **${cid}**\n\n` +
        `1. **Provider Review:** Dr. Sarah Wilson opens the case and clicks **Authorize Renewal**.\n` +
        `2. **State Transition:** Case automatically advances to \`ACTION_REQUIRED\`.\n` +
        `3. **NCPDP Dispatch:** RxResolve transmits approved electronic renewal to dispensing pharmacy via Surescripts.\n` +
        `4. **Patient Notification:** Patient receives automated SMS confirming refill approval.`;
    } else if (msg.includes('policy') || msg.includes('sop') || msg.includes('0 refill') || msg.includes('zero refill') || msg.includes('rule')) {
      ans = `### Practice SOP §4.2: Zero Refills Remaining Policy\n\n` +
        `• **Mandatory Rule:** When an existing prescription reaches 0 refills, automated renewals are suspended.\n` +
        `• **Threshold:** Maintenance medications with documented encounters in the past 12 months qualify for expedited provider renewal with a **24-hour SLA**.\n` +
        `• **Overdue Encounters (>12 mo):** Provider must select **Require Visit** and may grant a 30-day emergency bridge supply.`;
      sources = [
        {
          source: 'Practice SOP §4.2',
          title: 'Zero Refills Remaining Renewal Protocol',
          category: 'Practice SOPs'
        },
        {
          source: 'Admin Rule §8.0',
          title: 'Annual Encounter & Chronic Care Monitoring Policy',
          category: 'Administrative Rules'
        }
      ];
    } else if (msg.includes('sla') || msg.includes('tier') || msg.includes('time') || msg.includes('hour')) {
      ans = `### SLA Compliance & Operational Tiers\n\n` +
        `• **Target Turnaround:** **24.0 hours** from intake to resolution\n` +
        `• **Warning Threshold:** **8.0 hours** remaining (Amber alert sent to practice queue)\n` +
        `• **Breach Threshold:** **< 2.0 hours** remaining (Red escalation flag)\n` +
        `• **Current Performance:** **94.7%** network-wide SLA compliance rate with **4.2h** average resolution time.`;
      sources = [
        {
          source: 'Internal SLA Policy §1.4',
          title: 'Refill Resolution Response Timelines',
          category: 'Administrative Rules'
        }
      ];
    } else if (msg.includes('summar') || msg.includes('brief') || msg.includes('tell me') || msg.includes('case')) {
      ans = `### Case Summary: **${cid}**\n\n` +
        `• **Patient:** ${patient} | **Rx:** ${med} (${dosage})\n` +
        `• **Dispensing Location:** ${activeCase?.pharmacy_name || 'Downtown Pharmacy'}\n` +
        `• **Issue:** Refills exhausted (0 remaining). Patient has 2 doses left.\n` +
        `• **Recommendation:** Route to Dr. Sarah Wilson for 90-day renewal authorization.\n` +
        `• **Status:** Waiting for Provider review (${sla}h SLA clock).`;
    } else if (msg.includes('approve') || msg.includes('authorize') || msg.includes('sign')) {
      ans = `### Provider Authorization Guide\n\n` +
        `• To approve this refill as Dr. Sarah Wilson:\n` +
        `  1. Ensure your active persona is **Provider (Dr.)** (use the top banner switcher).\n` +
        `  2. Click the green **Authorize Renewal** button in the Clinical Decisions panel.\n` +
        `  3. Confirm the 3 refills / 90-day supply.\n` +
        `  4. The prescription is immediately queued for digital dispatch to the pharmacy.`;
    } else {
      ans = `Hello! I am your **RxResolve Copilot**, grounded in organizational clinical SOPs and active refill queues.\n\n` +
        `You can ask me:\n` +
        `• *"Why is case ${cid} stuck?"*\n` +
        `• *"Who needs to act on ${patient}'s refill?"*\n` +
        `• *"What is our SOP on 0 refills remaining?"*\n` +
        `• *"Explain our operational SLA tiers"*\n` +
        `• *"Summarize this case and recommended action"*`;
    }

    return {
      answer: ans,
      confidence: 0.96,
      recommended_next_step: activeCase?.required_next_action || 'Provider renewal review',
      sources
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
