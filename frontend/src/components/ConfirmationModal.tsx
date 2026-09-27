import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, CheckCircle, Calendar, MessageSquare, Ban } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionType: 'APPROVE' | 'REQUEST_INFO' | 'REQUIRE_VISIT' | 'DECLINE';
  caseId: string;
  patientName: string;
  medicationName: string;
  onConfirm: (data: { decision: string; notes: string; refills_approved?: number; visit_type_required?: string; request_details?: string }) => Promise<void>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  decisionType,
  caseId,
  patientName,
  medicationName,
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [refillsApproved, setRefillsApproved] = useState(3);
  const [visitType, setVisitType] = useState('Annual Wellness & Blood Pressure Encounter');
  const [requestDetails, setRequestDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const decisionConfig = {
    APPROVE: {
      title: 'Provider Authorization: Approve Prescription Renewal',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
      confirmLabel: 'Confirm & Authorize Refill',
      defaultNotes: 'Approved maintenance renewal based on chart review and documented stable condition.'
    },
    REQUEST_INFO: {
      title: 'Request Additional Information',
      icon: MessageSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      btnColor: 'bg-amber-600 hover:bg-amber-700',
      confirmLabel: 'Send Inquiry to Staff / Pharmacy',
      defaultNotes: 'Require clarification on recent lab results and patient adherence before authorization.'
    },
    REQUIRE_VISIT: {
      title: 'Clinical Encounter Required',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      confirmLabel: 'Order Clinical Visit',
      defaultNotes: 'Patient has not had an in-person or telehealth visit in >12 months. Clinic encounter required.'
    },
    DECLINE: {
      title: 'Decline Prescription Renewal',
      icon: Ban,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      btnColor: 'bg-rose-600 hover:bg-rose-700',
      confirmLabel: 'Confirm Renewal Decline',
      defaultNotes: 'Prescription renewal declined. Patient requires alternate therapy or urgent clinical evaluation.'
    }
  };

  const config = decisionConfig[decisionType];
  const Icon = config.icon;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm({
        decision: decisionType,
        notes: notes || config.defaultNotes,
        refills_approved: refillsApproved,
        visit_type_required: visitType,
        request_details: requestDetails
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md">
      <div className="glass-modal w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-5 border-b border-slate-200/60 flex items-center justify-between ${config.bgColor}`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-2xl bg-white shadow-xs ${config.color} border border-white/80`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{config.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Case {caseId} • {patientName} ({medicationName})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white/80 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Human In The Loop Notice */}
        <div className="p-3.5 bg-blue-50/50 border-b border-blue-100/60 flex items-start gap-2.5 text-xs text-slate-600 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Explicit Clinical Attestation: </span>
            This action constitutes an official clinical decision by the attending provider. AI recommendations do not replace medical judgment.
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {decisionType === 'APPROVE' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Number of Refills Authorized</label>
              <select
                value={refillsApproved}
                onChange={(e) => setRefillsApproved(Number(e.target.value))}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              >
                <option value={1}>1 Refill (30-day bridge)</option>
                <option value={2}>2 Refills (60-day supply)</option>
                <option value={3}>3 Refills (90-day maintenance supply - Standard)</option>
                <option value={5}>5 Refills (6-month chronic care)</option>
              </select>
            </div>
          )}

          {decisionType === 'REQUIRE_VISIT' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Required Encounter Type</label>
              <input
                type="text"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
                placeholder="e.g. In-person BP Check, Telehealth Comprehensive"
              />
              <p className="text-[11px] text-slate-500 mt-1">Staff will contact patient to schedule this appointment.</p>
            </div>
          )}

          {decisionType === 'REQUEST_INFO' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Information / Parameters Needed</label>
              <textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                rows={2}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
                placeholder="Specify missing lab panel, blood pressure log, or pharmacy inquiry..."
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Clinical Notes & Justification</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={config.defaultNotes}
              rows={3}
              className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="apple-btn-secondary px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 ${config.btnColor}`}
          >
            {submitting ? 'Recording Decision...' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
