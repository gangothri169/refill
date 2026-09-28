import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Bot,
  User,
  RotateCcw,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { RAGSource, RefillCase } from '../types';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaseId?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: RAGSource[];
  recommended_step?: string;
  confidence?: number;
  timestamp: string;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  currentCaseId
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(currentCaseId || 'ALL');
  const [availableCases, setAvailableCases] = useState<RefillCase[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load available cases for dropdown selection
  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.getCases();
        setAvailableCases(res);
      } catch (err) {
        console.error('Could not load case list for Copilot dropdown', err);
      }
    }
    if (isOpen) {
      loadCases();
    }
  }, [isOpen]);

  // Sync with currentCaseId when route changes
  useEffect(() => {
    if (currentCaseId) {
      setSelectedCaseId(currentCaseId);
    }
  }, [currentCaseId]);

  // Reset greeting whenever selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId && selectedCaseId !== 'ALL') {
      const activeCase = availableCases.find((c) => c.id === selectedCaseId);
      const patientName = activeCase ? activeCase.patient_name : selectedCaseId;
      const medName = activeCase ? activeCase.medication_name : '';
      setMessages([
        {
          id: `init-${selectedCaseId}`,
          sender: 'assistant',
          text: `👋 I am actively analyzing **${selectedCaseId}**${patientName !== selectedCaseId ? ` (${patientName} • ${medName})` : ''}.\n\nAsk me specific questions such as:\n• *Why is this refill stuck?*\n• *What information is missing?*\n• *Who needs to act next?*\n• *Can I approve this renewal?*\n• *What are the medication & dosage parameters?*`,
          confidence: 0.95,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages([
        {
          id: 'init-global',
          sender: 'assistant',
          text: `👋 I am monitoring operational refill queues across your clinical network.\n\nYou can:\n• Select a specific case from the dropdown above to inspect patient details, dosages, and blockers.\n• Ask *'Which cases need attention today?'* to view urgent queues.\n• Ask about practice policies like *'What is our 0 refills policy?'* or *'Explain SLA tiers'*.\n• Type any case ID directly (e.g. *'Why is RX-10482 blocked?'*).`,
          confidence: 0.95,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [selectedCaseId, availableCases]);

  const suggestedQuestions =
    selectedCaseId && selectedCaseId !== 'ALL'
      ? [
          'Why is this refill stuck?',
          'What is missing?',
          'Who needs to act?',
          'Can I approve this renewal?',
          'Show prescription & dosage',
          'What should I do next?',
          'Summarize this case.'
        ]
      : [
          'Which cases need attention today?',
          'What is our 0 refills policy?',
          'Explain SLA tiers and timelines',
          'What is the missing info policy?',
          'How does the demo flow work?'
        ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const caseIdToSend = selectedCaseId !== 'ALL' ? selectedCaseId : undefined;
      const res = await api.copilotChat(textToSend, caseIdToSend);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        recommended_step: res.recommended_next_step,
        confidence: res.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `Knowledge service temporarily unavailable. (${err.message || 'System degraded'})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (selectedCaseId && selectedCaseId !== 'ALL') {
      const activeCase = availableCases.find((c) => c.id === selectedCaseId);
      setMessages([
        {
          id: `init-${selectedCaseId}-reset`,
          sender: 'assistant',
          text: `Conversation reset. Analyzing **${selectedCaseId}** (${activeCase?.patient_name || 'Patient'}). What would you like to check?`,
          confidence: 0.95,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages([
        {
          id: 'init-global-reset',
          sender: 'assistant',
          text: `Conversation reset. What operational questions can I answer regarding queues or SOPs?`,
          confidence: 0.95,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] max-w-full bg-white/80 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-white/80 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>RxResolve Copilot</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-700 border border-blue-400/25 px-2 py-0.2 rounded-full font-mono font-semibold">RAG NLP</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Intelligent Healthcare Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Case Context Selector */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-600" />
            <span>Active Case Context:</span>
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full bg-white/70 text-xs text-slate-800 border border-slate-200/80 rounded-xl p-2 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 transition shadow-xs"
          >
            <option value="ALL">🌐 Global Queue (All Queues & SOPs)</option>
            {availableCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}: {c.patient_name} • {c.medication_name} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operational Guardrail Notice */}
      <div className="bg-amber-500/10 border-b border-amber-300/30 p-2.5 px-3 flex items-start gap-2 text-[11px] text-amber-900 backdrop-blur-md">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-tight">
          <span className="font-semibold">Clinical Boundary: </span>
          Provides routing & policy guidance. Never independently prescribes or approves renewals.
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
              {m.sender === 'user' ? (
                <>
                  <span className="font-medium text-slate-600">You</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-blue-600" />
                  <span className="font-semibold text-slate-700">RxResolve Copilot</span>
                  {m.confidence && (
                    <span className="text-emerald-600 font-bold font-mono">
                      ({Math.round(m.confidence * 100)}% conf)
                    </span>
                  )}
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[92%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md shadow-blue-500/20'
                  : 'glass-card text-slate-800 rounded-bl-sm border border-white/80'
              }`}
            >
              {m.text}

              {/* Recommended Next Step Box */}
              {m.recommended_step && (
                <div className="mt-3 pt-2.5 border-t border-blue-100 text-[11px] text-blue-950 bg-blue-50/70 p-2.5 rounded-xl flex items-start gap-2 border border-blue-200/50 backdrop-blur-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Recommended step: </span>
                    {m.recommended_step}
                  </div>
                </div>
              )}

              {/* RAG Grounding Citation */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-600" /> Grounded in Knowledge Base:
                  </div>
                  {m.sources.map((s, idx) => (
                    <div key={idx} className="bg-white/70 p-2 rounded-xl border border-slate-200/60 backdrop-blur-xs shadow-2xs">
                      <span className="font-semibold text-blue-700">{s.source}</span>: {s.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 p-3.5 glass-card text-slate-600 text-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Consulting clinical ledger and organizational SOPs...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Buttons */}
      <div className="p-3 border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-2 flex items-center justify-between">
          <span>Suggested Questions ({selectedCaseId === 'ALL' ? 'Global' : selectedCaseId})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-[11px] bg-white/70 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200/70 rounded-full px-2.5 py-1 transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span>{q}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Form */}
      <div className="p-3 border-t border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedCaseId !== 'ALL'
                ? `Ask anything about ${selectedCaseId}...`
                : 'Ask about queues, policies, or specific case IDs...'
            }
            className="flex-1 text-xs bg-white/70 border border-slate-200/80 rounded-full px-4 py-2 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 transition shadow-xs placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white transition-all shadow-md shadow-blue-500/25 active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
