import React from 'react';
import { CaseStatus } from '../types';

interface StatusBadgeProps {
  status: CaseStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    NEW: {
      bg: 'bg-slate-500/10 backdrop-blur-md',
      text: 'text-slate-700',
      border: 'border-slate-300/50',
      dot: 'bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.6)]',
      label: 'New Request'
    },
    TRIAGING: {
      bg: 'bg-sky-500/10 backdrop-blur-md',
      text: 'text-sky-800',
      border: 'border-sky-400/30',
      dot: 'bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.7)]',
      label: 'Triaging'
    },
    INVESTIGATING: {
      bg: 'bg-indigo-500/10 backdrop-blur-md',
      text: 'text-indigo-800',
      border: 'border-indigo-400/30',
      dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]',
      label: 'Investigating'
    },
    WAITING_FOR_INFORMATION: {
      bg: 'bg-amber-500/10 backdrop-blur-md',
      text: 'text-amber-800',
      border: 'border-amber-400/30',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
      label: 'Waiting for Info'
    },
    WAITING_FOR_PROVIDER: {
      bg: 'bg-blue-500/12 backdrop-blur-md',
      text: 'text-blue-800',
      border: 'border-blue-400/35',
      dot: 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.7)]',
      label: 'Waiting for Provider'
    },
    WAITING_FOR_PHARMACY: {
      bg: 'bg-teal-500/10 backdrop-blur-md',
      text: 'text-teal-800',
      border: 'border-teal-400/30',
      dot: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]',
      label: 'Waiting for Pharmacy'
    },
    WAITING_FOR_INSURANCE: {
      bg: 'bg-purple-500/10 backdrop-blur-md',
      text: 'text-purple-800',
      border: 'border-purple-400/30',
      dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]',
      label: 'Waiting for Insurance'
    },
    ACTION_REQUIRED: {
      bg: 'bg-orange-500/12 backdrop-blur-md',
      text: 'text-orange-900',
      border: 'border-orange-400/35',
      dot: 'bg-orange-500 animate-ping shadow-[0_0_8px_rgba(249,115,22,0.8)]',
      label: 'Action Required'
    },
    APPROVED: {
      bg: 'bg-emerald-500/15 backdrop-blur-md',
      text: 'text-emerald-900',
      border: 'border-emerald-400/40',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      label: 'Renewal Approved'
    },
    RESOLVED: {
      bg: 'bg-emerald-500/12 backdrop-blur-md',
      text: 'text-emerald-800',
      border: 'border-emerald-400/35',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      label: 'Resolved'
    },
    CANCELLED: {
      bg: 'bg-slate-500/10 backdrop-blur-md',
      text: 'text-slate-600',
      border: 'border-slate-300/40',
      dot: 'bg-slate-400',
      label: 'Cancelled'
    },
    FAILED: {
      bg: 'bg-rose-500/10 backdrop-blur-md',
      text: 'text-rose-800',
      border: 'border-rose-400/30',
      dot: 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.7)]',
      label: 'Integration Failed'
    },
    ESCALATED: {
      bg: 'bg-red-500/12 backdrop-blur-md',
      text: 'text-red-900',
      border: 'border-red-400/35',
      dot: 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]',
      label: 'Escalated'
    }
  };

  const config = statusConfig[status] || {
    bg: 'bg-slate-500/10 backdrop-blur-md',
    text: 'text-slate-700',
    border: 'border-slate-300/50',
    dot: 'bg-slate-400',
    label: status.replace(/_/g, ' ')
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-xs font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="tracking-tight">{config.label}</span>
    </span>
  );
};
