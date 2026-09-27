export type UserRole = 'PHARMACY_STAFF' | 'PRACTICE_STAFF' | 'PROVIDER' | 'ADMIN';

export type CaseStatus =
  | 'NEW'
  | 'TRIAGING'
  | 'INVESTIGATING'
  | 'WAITING_FOR_INFORMATION'
  | 'WAITING_FOR_PROVIDER'
  | 'WAITING_FOR_PHARMACY'
  | 'WAITING_FOR_INSURANCE'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'FAILED'
  | 'ESCALATED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  role_title: string;
  organization_id: string;
  organization_name: string;
  organization_type: string;
  avatar?: string;
}

export interface InformationCompleteness {
  patient_info: boolean;
  medication_info: boolean;
  pharmacy_info: boolean;
  prescription_details: boolean;
  provider_info: boolean;
  required_review_completed: boolean;
  details?: Record<string, string>;
}

export interface RAGSource {
  source: string;
  title: string;
  category: string;
  snippet: string;
}

export interface AIAnalysis {
  blocker: string;
  category: string;
  confidence: number;
  recommended_action: string;
  recommended_role: string;
  operational_priority: string;
  reasoning: string;
  summary: string;
  rag_sources?: RAGSource[];
  created_at?: string;
}

export interface RefillCase {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_dob: string;
  patient_phone?: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  quantity: number;
  days_supply: number;
  refills_requested: number;
  refills_remaining: number;
  last_fill_date?: string;
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_phone?: string;
  practice_id: string;
  practice_name: string;
  provider_id: string;
  provider_name: string;
  status: CaseStatus;
  previous_status?: string;
  last_status_reason?: string;
  blocker: string;
  blocker_category: string;
  priority: PriorityLevel;
  priority_score: number;
  owner_id?: string;
  owner_name?: string;
  owner_role?: string;
  required_next_action: string;
  sla_deadline?: string;
  sla_hours_remaining: number;
  sla_status: 'HEALTHY' | 'WARNING' | 'BREACHED';
  information_completeness: InformationCompleteness;
  ai_analysis?: AIAnalysis;
  notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  from_status?: string;
  to_status?: string;
  note?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface CommunicationMessage {
  id: string;
  case_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_org: string;
  recipient_role: string;
  content: string;
  is_ai_drafted: boolean;
  reviewed_by_human: boolean;
  attachments?: string[];
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipient_role?: string;
  recipient_user_id?: string;
  case_id?: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  action_url?: string;
  timestamp: string;
}

export interface IntegrationServiceItem {
  id: string;
  name: string;
  category: string;
  protocol: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  latency_ms: number;
  success_rate: number;
  last_sync: string;
  last_error?: string;
  simulate_failure: boolean;
  details?: Record<string, any>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  case_id?: string;
  actor_type: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  event_type: string;
  previous_state?: string;
  new_state?: string;
  confidence?: number;
  details?: Record<string, any>;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  source_name: string;
  content: string;
  keywords?: string[];
  version?: string;
  updated_at?: string;
}
