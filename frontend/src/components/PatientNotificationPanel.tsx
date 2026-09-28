import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Bell,
  Smartphone,
  ChevronRight,
  User,
  Pill,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface PatientNotificationPanelProps {
  caseId: string;
  patientName: string;
  medicationName: string;
  pharmacyName: string;
  status: string;
}

interface PatientMessage {
  id: string;
  time: string;
  channel: 'SMS' | 'Portal' | 'Pharmacy';
  message: string;
  delivered: boolean;
}

// Generates realistic patient-facing messages based on case status
function getPatientMessages(
  status: string,
  patientName: string,
  medicationName: string,
  pharmacyName: string,
  caseId: string
): PatientMessage[] {
  const firstName = patientName.split(' ')[0];
  const med = medicationName.split(' ')[0];

  const allMessages: Record<string, PatientMessage[]> = {
    SUBMITTED: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill request has been received by ${pharmacyName} and forwarded to your care team. Ref: ${caseId}.`,
        delivered: true
      }
    ],
    PENDING_TRIAGE: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill request has been received. Your care team is reviewing it now.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '09:22 AM',
        channel: 'Portal',
        message: `Your refill request for ${medicationName} is under clinical review. You'll receive an update within 4 hours.`,
        delivered: true
      }
    ],
    BLOCKED_MISSING_INFO: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill is being reviewed. We may need additional information.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '10:05 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your care team needs some additional information to process your ${med} refill. A staff member will contact you shortly.`,
        delivered: true
      }
    ],
    BLOCKED_NEEDS_PA: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill requires prior authorization from your insurance. Your care team is submitting the request now.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '10:30 AM',
        channel: 'Portal',
        message: `Prior authorization submitted for ${medicationName}. Typical processing time is 24–72 hours. We'll notify you as soon as it's approved.`,
        delivered: true
      }
    ],
    PROVIDER_REVIEW: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill has been sent to your physician for review and renewal authorization.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '11:00 AM',
        channel: 'SMS',
        message: `Your ${med} refill is awaiting physician sign-off. This typically takes 2–4 hours during clinic hours.`,
        delivered: true
      }
    ],
    APPROVED: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill is being reviewed by your care team.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '11:47 AM',
        channel: 'SMS',
        message: `✅ Great news, ${firstName}! Your physician has approved the ${med} refill. ${pharmacyName} is now preparing your prescription.`,
        delivered: true
      },
      {
        id: 'msg-3',
        time: '12:10 PM',
        channel: 'Pharmacy',
        message: `${pharmacyName}: ${medicationName} is ready for pickup. Please bring your insurance card. Hours: Mon–Fri 8am–8pm.`,
        delivered: true
      }
    ],
    RESOLVED_AT_PHARMACY: [
      {
        id: 'msg-1',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill request was received and processed by your care team.`,
        delivered: true
      },
      {
        id: 'msg-2',
        time: '11:47 AM',
        channel: 'SMS',
        message: `✅ ${firstName}, your ${med} has been approved and sent to ${pharmacyName}.`,
        delivered: true
      },
      {
        id: 'msg-3',
        time: '12:15 PM',
        channel: 'Pharmacy',
        message: `${pharmacyName}: Your ${medicationName} prescription has been dispensed. Pick up at your convenience.`,
        delivered: true
      },
      {
        id: 'msg-4',
        time: '12:45 PM',
        channel: 'Portal',
        message: `Your refill case ${caseId} has been resolved. ${medicationName} is ready at ${pharmacyName}. Have a great day!`,
        delivered: true
      }
    ]
  };

  return (
    allMessages[status] ||
    allMessages['PENDING_TRIAGE'] || [
      {
        id: 'msg-default',
        time: '09:14 AM',
        channel: 'SMS',
        message: `Hi ${firstName}, your ${med} refill is being processed. We'll keep you updated.`,
        delivered: true
      }
    ]
  );
}

const channelColors: Record<string, string> = {
  SMS: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60',
  Portal: 'bg-brand-500/10 text-brand-800 border-brand-300/60',
  Pharmacy: 'bg-amber-500/10 text-amber-800 border-amber-300/60'
};

const channelIcons: Record<string, React.ReactNode> = {
  SMS: <Smartphone className="w-3 h-3" />,
  Portal: <Activity className="w-3 h-3" />,
  Pharmacy: <Pill className="w-3 h-3" />
};

export const PatientNotificationPanel: React.FC<PatientNotificationPanelProps> = ({
  caseId,
  patientName,
  medicationName,
  pharmacyName,
  status
}) => {
  const messages = getPatientMessages(status, patientName, medicationName, pharmacyName, caseId);
  const firstName = patientName.split(' ')[0];

  return (
    <div id="patient-notification-log" className="glass-card rounded-3xl p-5 space-y-4 border border-emerald-300/30 bg-gradient-to-br from-white/80 via-emerald-50/20 to-teal-50/10 scroll-mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/25">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Patient Communication Log</h2>
            <p className="text-[11px] text-slate-500 font-medium">Outbound notifications keeping {firstName} informed in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>{messages.length} Messages Delivered</span>
        </div>
      </div>

      {/* Patient Info Strip */}
      <div className="flex items-center gap-3 p-3 glass-card-subtle rounded-xl border border-white/60">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-slate-900">{patientName}</div>
          <div className="text-slate-500">
            Prescription: <span className="font-semibold text-slate-700">{medicationName}</span> •{' '}
            Pharmacy: <span className="font-semibold text-slate-700">{pharmacyName}</span>
          </div>
        </div>
        <div className="ml-auto text-[10px] font-mono text-slate-400 font-semibold shrink-0">Ref: {caseId}</div>
      </div>

      {/* Message Thread */}
      <div className="space-y-2.5">
        {messages.map((msg, idx) => (
          <div key={msg.id} className="flex items-start gap-3 group">
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              {idx < messages.length - 1 && (
                <div className="w-px h-full min-h-[24px] bg-slate-200/80 mt-1" />
              )}
            </div>

            {/* Message Card */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-semibold text-slate-400">{msg.time}</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-xs ${channelColors[msg.channel]}`}
                >
                  {channelIcons[msg.channel]}
                  {msg.channel}
                </span>
                {msg.delivered && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Delivered
                  </span>
                )}
              </div>
              <div className="glass-card-subtle rounded-xl p-3 text-xs text-slate-800 leading-relaxed border border-white/60 font-medium">
                {msg.message}
              </div>
            </div>
          </div>
        ))}

        {/* Pending Next Message Indicator */}
        {status !== 'RESOLVED_AT_PHARMACY' && (
          <div className="flex items-start gap-3 opacity-50">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className="w-2 h-2 rounded-full bg-slate-300 border-2 border-slate-200 animate-pulse" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-semibold text-slate-400">Pending...</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                  <Clock className="w-3 h-3" />
                  Awaiting resolution
                </span>
              </div>
              <div className="glass-card-subtle rounded-xl p-3 text-xs text-slate-400 leading-relaxed border border-dashed border-slate-200 italic">
                Next notification will be sent automatically when the refill is approved or resolved.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>PHI-safe — No diagnosis or clinical data transmitted to patient channel</span>
        </div>
        <span className="font-mono">HIPAA Compliant</span>
      </div>
    </div>
  );
};
