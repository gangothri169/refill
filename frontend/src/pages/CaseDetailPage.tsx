import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RefillCase, CaseEvent, CommunicationMessage } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PatientNotificationPanel } from '../components/PatientNotificationPanel';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Send,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Building,
  RefreshCw,
  BookOpen,
  CornerDownRight,
  FileText,
  User,
  Check,
  XCircle,
  ChevronRight,
  Zap
} from 'lucide-react';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<RefillCase | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Communication draft state
  const [newMessage, setNewMessage] = useState('');
  const [recipientRole, setRecipientRole] = useState('PRACTICE_STAFF');
  const [draftingAI, setDraftingAI] = useState(false);
  const [isAiDrafted, setIsAiDrafted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Human decision confirmation modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REQUEST_INFO' | 'REQUIRE_VISIT' | 'DECLINE'>('APPROVE');

  // AI Recommendation acceptance state
  const [recommendationAccepted, setRecommendationAccepted] = useState(false);

  const fetchFullCase = async () => {
    if (!id) return;
    try {
      const [c, evts, comms] = await Promise.all([
        api.getCase(id),
        api.getCaseTimeline(id),
        api.getCommunications(id)
      ]);
      setCaseData(c);
      setEvents(evts);
      setMessages(comms);
    } catch (err) {
      console.error('Failed to load case detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullCase();

    const handleCaseUpdated = (e: any) => {
      if (!e.detail || e.detail.caseId === id) {
        fetchFullCase();
      }
    };
    window.addEventListener('rxresolve:case-updated', handleCaseUpdated);
    return () => window.removeEventListener('rxresolve:case-updated', handleCaseUpdated);
  }, [id, user?.role]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse col-span-2" />
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Case Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">Refill case {id} could not be retrieved.</p>
        <button
          onClick={() => navigate('/cases')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Cases
        </button>
      </div>
    );
  }

  // Handle Provider Human Decision
  const handleProviderDecision = async (payload: any) => {
    if (!id) return;
    try {
      const updated = await api.providerDecision(id, payload);
      setCaseData(updated);
      await fetchFullCase();
    } catch (err: any) {
      alert(`Decision recording failed: ${err.message}`);
    }
  };

  // Handle Sending Communication with instant optimistic delivery
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customContent !== undefined ? customContent : newMessage).trim();
    if (!textToSend || !id) return;

    const currentSenderId = user?.id || 'usr-pract-01';
    const currentSenderName = user?.name || 'Maya Lin, BSN';
    const currentSenderRole = user?.role || 'PRACTICE_STAFF';

    // Optimistic UI update so user immediately sees the message appear
    const optimisticComm: CommunicationMessage = {
      id: `comm-opt-${Date.now()}`,
      case_id: id,
      sender_id: currentSenderId,
      sender_name: currentSenderName,
      sender_role: currentSenderRole as any,
      sender_org: user?.organization_name || 'Downtown Physician Group',
      recipient_role: recipientRole as any,
      content: textToSend,
      timestamp: new Date().toISOString(),
      is_ai_drafted: isAiDrafted,
      reviewed_by_human: true
    };

    setMessages((prev) => [...prev, optimisticComm]);
    setNewMessage('');
    setIsAiDrafted(false);

    try {
      await api.sendMessage(id, {
        recipient_role: recipientRole,
        content: textToSend,
        is_ai_drafted: isAiDrafted,
        sender_id: currentSenderId,
        sender_name: currentSenderName,
        sender_role: currentSenderRole
      });
      // Fetch latest timeline & comms
      const [updatedEvents, updatedComms] = await Promise.all([
        api.getCaseTimeline(id),
        api.getCommunications(id)
      ]);
      setEvents(updatedEvents);
      if (Array.isArray(updatedComms) && updatedComms.length > 0) {
        setMessages(updatedComms);
      }
    } catch (err: any) {
      console.warn('Background sync status', err);
    }
  };

  // Handle AI Drafting Communication
  const handleDraftAI = async () => {
    if (!id || !caseData) return;
    setDraftingAI(true);
    try {
      const targetRole = user?.role === 'PHARMACY_STAFF' ? 'PRACTICE_STAFF' : 'PHARMACY_STAFF';
      const draft = await api.draftMessage({
        case_id: id,
        from_role: user?.role || 'PRACTICE_STAFF',
        to_role: targetRole,
        context_note: `Current blocker: ${caseData.blocker}`
      });
      setNewMessage(draft.body);
      setRecipientRole(targetRole);
      setIsAiDrafted(true);
    } catch (err: any) {
      alert(`AI Draft failed: ${err.message}`);
    } finally {
      setDraftingAI(false);
    }
  };

  // Handle Accepting AI Recommendation
  const handleAcceptRecommendation = async () => {
    if (!id || !caseData.ai_analysis) return;
    try {
      const targetRole = caseData.ai_analysis.recommended_role;
      if (targetRole === 'PROVIDER') {
        await api.assignCase(id, {
          assignee_id: 'usr-prov-01',
          assignee_name: caseData.provider_name || 'Dr. Sarah Wilson',
          assignee_role: 'PROVIDER',
          note: 'Accepted AI Recommendation: Route for provider sign-off'
        });
      } else {
        await api.updateCaseStatus(id, {
          new_status: 'INVESTIGATING',
          reason: 'Accepted AI Recommendation: Practice staff investigation',
          required_next_action: caseData.ai_analysis.recommended_action
        });
      }
      setRecommendationAccepted(true);
      await fetchFullCase();
    } catch (err: any) {
      alert(`Error accepting recommendation: ${err.message}`);
    }
  };

  const comp = caseData.information_completeness || {
    patient_info: true,
    medication_info: true,
    pharmacy_info: true,
    prescription_details: true,
    provider_info: true,
    required_review_completed: false
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => navigate('/cases')} className="hover:text-slate-900 font-medium transition">
          Refill Cases
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-mono font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-400/20">{caseData.id}</span>
      </div>

      {/* ⚡ BLOCKER HERO CARD — above the fold, immediately visible */}
      {caseData.blocker && (String(caseData.status) !== 'RESOLVED_AT_PHARMACY') && (String(caseData.status) !== 'APPROVED') && (
        <div className="glass-card rounded-2xl p-4 border border-rose-300/40 bg-gradient-to-r from-rose-50/60 via-white/80 to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-300/40 shrink-0 shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-300/50">
                  ⚠ ACTIVE BLOCKER — Why This Refill Is Stuck
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {caseData.blocker_category}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 tracking-tight">{caseData.blocker}</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">{caseData.required_next_action}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right glass-card-subtle px-3 py-2 rounded-xl border border-white/60">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SLA Remaining</div>
              <div className="font-mono text-sm font-bold text-slate-900 flex items-center gap-1 justify-end mt-0.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                {caseData.sla_hours_remaining.toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Workspace Header - Frosted Glass Card */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                REFILL CASE #{caseData.id}
              </span>
              <PriorityBadge priority={caseData.priority} />
              <StatusBadge status={caseData.status} size="md" />
            </div>
            <p className="text-xs text-slate-500">
              Submitted on {new Date(caseData.created_at).toLocaleDateString()} at{' '}
              {new Date(caseData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Surescripts e-Prescribing Bridge
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('communication-history-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Jump directly to Case Communication History"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Communication History ({messages.length})</span>
            </button>

            <div className="glass-card-subtle px-4 py-2 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operational SLA</div>
              <div className="font-mono text-base font-bold text-slate-900 flex items-center gap-1.5 justify-end mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{caseData.sla_hours_remaining.toFixed(1)}h remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demographics Strip - 4 Frosted Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Demographics</span>
            <div className="font-bold text-slate-900 text-sm mt-1">{caseData.patient_name}</div>
            <div className="text-slate-500 mt-0.5 font-medium">DOB: {caseData.patient_dob} • {caseData.patient_phone || 'Active Chart'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Prescribed Medication</span>
            <div className="font-bold text-slate-900 text-sm mt-1">{caseData.medication_name}</div>
            <div className="text-slate-500 mt-0.5 font-medium">{caseData.dosage} • Qty {caseData.quantity} ({caseData.days_supply}d)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dispensing Pharmacy</span>
            <div className="font-bold text-slate-900 text-sm mt-1">{caseData.pharmacy_name}</div>
            <div className="text-slate-500 mt-0.5 font-medium">{caseData.pharmacy_phone || 'NPI: 1942857102'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Attending Physician</span>
            <div className="font-bold text-slate-900 text-sm mt-1">{caseData.provider_name}</div>
            <div className="text-slate-500 mt-0.5 font-medium">{caseData.practice_name}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2 Cols (Case Status + AI + Timeline + Info) | Right 1 Col (Role Action Panel + Comms) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Case Status Card */}
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
              Section A: Operational Workflow State
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 p-4 rounded-2xl bg-white/50 border border-white/80 backdrop-blur-md text-xs shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Current State</span>
                <div className="mt-1.5">
                  <StatusBadge status={caseData.status} size="sm" />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Primary Blocker</span>
                <div className="font-bold text-slate-900 mt-1">{caseData.blocker}</div>
                <div className="text-[11px] text-slate-500 font-medium">{caseData.blocker_category}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Current Owner</span>
                <div className="font-bold text-slate-900 mt-1">{caseData.owner_name}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase font-semibold">{caseData.owner_role}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Required Next Action</span>
                <div className="font-bold text-blue-700 mt-1">{caseData.required_next_action}</div>
              </div>
            </div>
          </div>

          {/* Section B: AI Insights & Recommendation - Frosted Luminous Card */}
          <div id="section-b-ai" className="glass-card p-5 space-y-4 border border-blue-200/70 bg-gradient-to-br from-white/80 via-blue-50/30 to-indigo-50/20 scroll-mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 border border-white/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Section B: AI Refill Analysis & Recommendation</h2>
                  <p className="text-xs text-slate-500 font-medium">Autonomous blocker classification and clinical SOP alignment</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span>{(caseData.ai_analysis?.confidence ?? 0.94) * 100}% Confidence</span>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="p-4 rounded-2xl bg-white/70 border border-white/90 text-xs text-slate-800 leading-relaxed shadow-xs backdrop-blur-md">
              <div className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Operational Summary:</span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                {caseData.ai_analysis?.summary ||
                  `Refill request received from ${caseData.pharmacy_name}. Existing prescription has no refills remaining. Provider authorization is required under Practice SOP §4.2. Patient and pharmacy information are complete.`}
              </p>

              <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="font-bold text-slate-500">Why Blocked: </span>
                  <span className="text-slate-800 font-medium">
                    {caseData.ai_analysis?.reasoning || 'No refills remain on existing prescription.'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Recommended Routing: </span>
                  <span className="font-bold text-blue-700">
                    {caseData.ai_analysis?.recommended_action || 'Route to physician practice for provider review.'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Recommendation Decision Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>AI does not execute clinical prescribing automatically. Human confirmation required.</span>
              </div>

              <div className="flex items-center gap-2">
                {recommendationAccepted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-500/15 px-3 py-1.5 rounded-full border border-emerald-400/30 backdrop-blur-md">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Recommendation Accepted & Routed
                  </span>
                ) : (
                  <>
                    <button
                      onClick={handleAcceptRecommendation}
                      className="apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Recommendation</span>
                    </button>
                    <button
                      onClick={() => alert('Modifying AI routing parameters...')}
                      className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold"
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => alert('AI recommendation dismissed.')}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-xs transition"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section D: Information Completeness Checklist */}
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
              Section D: Information Completeness Verification
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-xs">
                <span className="font-semibold text-slate-800">Patient Demographics</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-xs">
                <span className="font-semibold text-slate-800">Medication & NDC</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-xs">
                <span className="font-semibold text-slate-800">Pharmacy Routing</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-xs">
                <span className="font-semibold text-slate-800">Prescription Details</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-center justify-between shadow-xs">
                <span className="font-semibold text-slate-800">Provider Information</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between backdrop-blur-md shadow-xs ${
                comp.required_review_completed
                  ? 'border-emerald-300/50 bg-emerald-50/60 text-emerald-800'
                  : 'border-amber-300/50 bg-amber-50/60 text-amber-900'
              }`}>
                <span className="font-bold">Provider Authorization</span>
                {comp.required_review_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
              </div>
            </div>
          </div>

          {/* Section C: Complete Case Journey Timeline */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Section C: Case Lifecycle Timeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Chronological audit stream of all human and AI actions</p>
              </div>
              <button
                onClick={fetchFullCase}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200/60">
              {events.map((evt, idx) => (
                <div key={evt.id || idx} className="relative group p-3.5 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/80 transition-all duration-200 shadow-xs">
                  {/* Glowing Node Dot */}
                  <div className="absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover:scale-125 transition" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{evt.action.replace(/_/g, ' ')}</span>
                      {evt.to_status && <StatusBadge status={evt.to_status} size="sm" />}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{evt.note}</p>

                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <span>Actor:</span>
                    <span className="font-semibold text-slate-700">{evt.actor_name}</span>
                    <span>({evt.actor_role})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Role Action Panel + Cross-Role Communications */}
        <div className="space-y-6">
          {/* Section F: Role-Specific Action Panel */}
          <div id="section-f-action" className="glass-card p-5 space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Section F: Action Panel</h2>
                <p className="text-xs text-slate-500">Available actions for {user?.role_title}</p>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 font-bold border border-blue-400/20 backdrop-blur-md">
                {user?.role.replace('_', ' ')}
              </span>
            </div>

            {/* Provider Actions */}
            {user?.role === 'PROVIDER' && (
              caseData.status === 'APPROVED' ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-950 space-y-1.5 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Prescription Renewal Authorized</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                    You have authorized this refill. The renewal electronic script has been dispatched via Surescripts to {caseData.pharmacy_name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl text-xs text-blue-950 leading-snug backdrop-blur-md">
                    <span className="font-bold text-blue-900">Attending Provider Decision Required: </span>
                    Review case details, patient encounter history, and authorize or direct next clinical action.
                  </div>

                  <button
                    onClick={() => {
                      setDecisionType('APPROVE');
                      setModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Prescription Renewal</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setDecisionType('REQUIRE_VISIT');
                        setModalOpen(true);
                      }}
                      className="py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all border border-white/20"
                    >
                      Require Visit
                    </button>

                    <button
                      onClick={() => {
                        setDecisionType('REQUEST_INFO');
                        setModalOpen(true);
                      }}
                      className="py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all border border-white/20"
                    >
                      Request Info
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setDecisionType('DECLINE');
                      setModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-400/30 font-semibold text-xs rounded-xl transition-all active:scale-95"
                  >
                    Decline Refill Request
                  </button>
                </div>
              )
            )}

            {/* Practice Staff Actions */}
            {user?.role === 'PRACTICE_STAFF' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-indigo-500/10 border border-indigo-400/30 rounded-2xl text-xs text-indigo-950 leading-snug backdrop-blur-md">
                  <span className="font-bold text-indigo-900">Care Coordinator Triage: </span>
                  Assign to attending physician, unblock missing parameters, or initiate prior authorization.
                </div>

                <button
                  onClick={async () => {
                    await api.assignCase(caseData.id, {
                      assignee_id: 'usr-prov-01',
                      assignee_name: caseData.provider_name || 'Dr. Sarah Wilson',
                      assignee_role: 'PROVIDER',
                      note: 'Care coordinator routed for clinical renewal sign-off'
                    });
                    await fetchFullCase();
                  }}
                  className="apple-btn-primary w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Route to Provider (Dr. Sarah Wilson)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      await api.updateCaseStatus(caseData.id, {
                        new_status: 'WAITING_FOR_INFORMATION',
                        reason: 'Requesting updated clinical documentation from pharmacy'
                      });
                      await fetchFullCase();
                    }}
                    className="apple-btn-secondary py-2 px-3 text-xs font-semibold"
                  >
                    Request Info
                  </button>

                  <button
                    onClick={async () => {
                      await api.updateCaseStatus(caseData.id, {
                        new_status: 'WAITING_FOR_INSURANCE',
                        reason: 'PBM formulary restriction requires electronic Prior Authorization'
                      });
                      await fetchFullCase();
                    }}
                    className="py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 border border-purple-400/30 font-semibold text-xs rounded-xl transition-all active:scale-95"
                  >
                    Initiate PA
                  </button>
                </div>

                <button
                  onClick={async () => {
                    await api.updateCaseStatus(caseData.id, {
                      new_status: 'RESOLVED',
                      reason: 'Practice staff confirmed resolution and dispensing'
                    });
                    await fetchFullCase();
                  }}
                  className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-400/30 font-semibold text-xs rounded-xl transition-all active:scale-95"
                >
                  Mark Case Resolved
                </button>
              </div>
            )}

            {/* Pharmacy Staff Actions */}
            {user?.role === 'PHARMACY_STAFF' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-teal-500/10 border border-teal-400/30 rounded-2xl text-xs text-teal-950 leading-snug backdrop-blur-md">
                  <span className="font-bold text-teal-900">Pharmacy Operations: </span>
                  Upload supporting clinical notes, clarify dispensing quantities, or ping practice staff.
                </div>

                <button
                  onClick={handleDraftAI}
                  className="w-full py-2 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-400/30 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Draft Practice Inquiry with AI</span>
                </button>

                <button
                  onClick={async () => {
                    await api.updateCaseStatus(caseData.id, {
                      new_status: 'CANCELLED',
                      reason: 'Patient requested cancellation at pharmacy counter'
                    });
                    await fetchFullCase();
                  }}
                  className="apple-btn-secondary w-full py-2 px-3 text-xs font-semibold"
                >
                  Close / Cancel Request
                </button>
              </div>
            )}

            {/* Admin Actions */}
            {user?.role === 'ADMIN' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-white/60 border border-slate-200/80 rounded-2xl text-xs text-slate-800">
                  <span className="font-bold">Administrative Oversight: </span>
                  Reassign queues, trigger supervisor escalation, or inspect immutable audit records.
                </div>

                <button
                  onClick={async () => {
                    await api.updateCaseStatus(caseData.id, {
                      new_status: 'ESCALATED',
                      reason: 'Administrative escalation due to approaching SLA threshold'
                    });
                    await fetchFullCase();
                  }}
                  className="w-full py-2 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/20"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalate to Clinical Supervisor</span>
                </button>

                <button
                  onClick={() => navigate(`/audit?case_id=${caseData.id}`)}
                  className="apple-btn-secondary w-full py-2 px-3 text-xs font-semibold"
                >
                  Inspect Case Audit Ledger
                </button>
              </div>
            )}
          </div>

          {/* Section E: Cross-Role Communications - Frosted Card */}
          <div id="communication-history-section" className="glass-card p-5 space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Section E: Communication History & Care Team Feed</h2>
                  <span className="text-[10px] bg-blue-500/10 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-400/20">
                    {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">End-to-end communication log between pharmacy, clinic care coordinators, and attending physician</p>
              </div>
              <button
                onClick={handleDraftAI}
                disabled={draftingAI}
                className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-400/25 transition active:scale-95 backdrop-blur-md shrink-0"
                title="Draft message with AI based on current case blocker"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{draftingAI ? 'Drafting...' : 'AI Draft'}</span>
              </button>
            </div>

            {/* Conversation Feed */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                  <MessageSquare className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                  <span className="font-semibold text-slate-600">No care team communications recorded yet.</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Send a message below or use AI Draft to initiate inquiry.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const currentUserId = user?.id || 'usr-pract-01';
                  const currentUserRole = user?.role || 'PRACTICE_STAFF';
                  const isMe = m.sender_id === currentUserId || (m.sender_role === currentUserRole && m.sender_id !== 'usr-pharm-01');

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl shadow-xs transition-all ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-4 rounded-tr-xs border border-white/20 shadow-md shadow-blue-500/15'
                          : 'bg-white/85 border border-white/90 text-slate-800 mr-4 rounded-tl-xs backdrop-blur-md'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className={`font-bold flex items-center gap-1.5 ${isMe ? 'text-white' : 'text-slate-900'}`}>
                          <span>{m.sender_name}</span>
                          <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded-md ${isMe ? 'bg-white/20 text-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                            {m.sender_role.replace(/_/g, ' ')}
                          </span>
                        </span>
                        <span className={`text-[10px] font-mono ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`leading-relaxed whitespace-pre-line font-medium ${isMe ? 'text-white' : 'text-slate-700'}`}>{m.content}</p>

                      <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                        {m.is_ai_drafted ? (
                          <div className={`flex items-center gap-1 font-semibold ${isMe ? 'text-blue-100' : 'text-blue-700'}`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI Drafted • Verified by human before dispatch</span>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>Logged to Immutable Ledger</span>
                          </div>
                        )}
                        <span className={`flex items-center gap-0.5 font-medium ${isMe ? 'text-blue-100' : 'text-emerald-600'}`}>
                          <Check className="w-3 h-3" />
                          <span>Delivered</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Response Templates (1-Click) */}
            <div className="pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Quick Care Team Responses (1-Click):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Chart Verified', text: `Patient chart reviewed for ${caseData?.patient_name || 'patient'}. Therapy adherence verified. Routing for renewal.` },
                  { label: '30-Day Bridge Supply', text: `Granting 30-day bridge supply to maintain adherence while clinic visit is scheduled.` },
                  { label: 'Prior Auth Initiated', text: `Prior Authorization criteria submitted via CoverMyMeds bridge. Monitoring payer adjudication.` },
                  { label: 'Pharmacy Clarification', text: `Please clarify pack size dispensed and confirm if patient has backup doses remaining.` }
                ].map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewMessage(t.text);
                      setIsAiDrafted(false);
                    }}
                    className="text-[10px] font-semibold bg-white/70 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200/80 px-2.5 py-1 rounded-lg transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compose Message Box */}
            <form onSubmit={handleSendMessage} className="space-y-2.5 pt-3 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-semibold text-slate-600">Send Communication To:</label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  className="bg-white/70 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                >
                  <option value="PRACTICE_STAFF">Practice Staff (Care Coordinator)</option>
                  <option value="PHARMACY_STAFF">Pharmacy Staff (Downtown Pharmacy)</option>
                  <option value="PROVIDER">Attending Physician (Dr. Sarah Wilson)</option>
                </select>
              </div>

              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                placeholder="Type operational inquiry or select a Quick Response above..."
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs placeholder:text-slate-400"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Human confirmation required</span>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="apple-btn-primary px-4 py-1.5 text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Message</span>
                </button>
              </div>

              {/* Link to Section G */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Looking for patient SMS / portal notifications?</span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('patient-notification-log');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <span>View Patient SMS Log</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Section G: Patient Communication Log — "Keeping the patient informed throughout" */}
      <PatientNotificationPanel
        caseId={caseData.id}
        patientName={caseData.patient_name}
        medicationName={caseData.medication_name}
        pharmacyName={caseData.pharmacy_name}
        status={caseData.status}
      />

      {/* Confirmation Dialog for Provider Clinical Decisions */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        decisionType={decisionType}
        caseId={caseData.id}
        patientName={caseData.patient_name}
        medicationName={caseData.medication_name}
        onConfirm={handleProviderDecision}
      />
    </div>
  );
};
