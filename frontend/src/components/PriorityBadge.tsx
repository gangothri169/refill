import React from 'react';
import { PriorityLevel } from '../types';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const p = priority.toUpperCase();
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CRITICAL: { bg: 'bg-red-500/12 backdrop-blur-md', text: 'text-red-800', border: 'border-red-400/35', label: 'CRITICAL' },
    HIGH: { bg: 'bg-orange-500/12 backdrop-blur-md', text: 'text-orange-800', border: 'border-orange-400/35', label: 'HIGH' },
    MEDIUM: { bg: 'bg-amber-500/10 backdrop-blur-md', text: 'text-amber-800', border: 'border-amber-400/30', label: 'MEDIUM' },
    LOW: { bg: 'bg-slate-500/10 backdrop-blur-md', text: 'text-slate-600', border: 'border-slate-300/40', label: 'LOW' }
  };

  const c = config[p] || config.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs ${c.bg} ${c.text} ${c.border}`}
      title="Workflow operational priority score (not a clinical triage score)"
    >
      {c.label}
    </span>
  );
};
