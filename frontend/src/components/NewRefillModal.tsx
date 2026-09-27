import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Building, Pill, User, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface NewRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newCase: any) => void;
}

export const NewRefillModal: React.FC<NewRefillModalProps> = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('Jordan Taylor');
  const [patientDob, setPatientDob] = useState('1982-08-14');
  const [medicationName, setMedicationName] = useState('Lisinopril 10mg');
  const [dosage, setDosage] = useState('10mg PO Daily');
  const [quantity, setQuantity] = useState(30);
  const [daysSupply, setDaysSupply] = useState(30);
  const [refillsRemaining, setRefillsRemaining] = useState(0);
  const [pharmacyName, setPharmacyName] = useState('Downtown Pharmacy');
  const [practiceName, setPracticeName] = useState('Downtown Physician Group');
  const [providerName, setProviderName] = useState('Dr. Sarah Wilson');
  const [notes, setNotes] = useState('Electronic renewal request received. Prescription indicates 0 refills remain.');
  const [forceBlocker, setForceBlocker] = useState('No refills remaining');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation guard to prevent 422 from backend
    if (!patientName.trim()) return setError('Patient name is required.');
    if (!patientDob.trim()) return setError('Date of birth is required.');
    if (!medicationName.trim()) return setError('Medication name is required.');
    if (!dosage.trim()) return setError('Dosage is required.');
    if (!pharmacyName.trim()) return setError('Pharmacy name is required.');
    if (!providerName.trim()) return setError('Provider name is required.');
    if (quantity <= 0) return setError('Quantity must be greater than 0.');
    if (daysSupply <= 0) return setError('Days supply must be greater than 0.');

    setLoading(true);
    try {
      const payload = {
        patient_name: patientName.trim(),
        patient_dob: patientDob,
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        quantity: quantity,
        days_supply: daysSupply,
        refills_requested: 1,
        refills_remaining: refillsRemaining,
        pharmacy_name: pharmacyName,
        practice_name: practiceName,
        provider_name: providerName,
        notes: notes || undefined,
        force_blocker: forceBlocker || undefined
      };
      console.log('[NewRefillModal] Submitting payload:', payload);
      const res = await api.createCase(payload);
      console.log('[NewRefillModal] Case created:', res.id);
      if (onCreated) onCreated(res);
      onClose();
      navigate(`/cases/${res.id}`);
    } catch (err: any) {
      console.error('[NewRefillModal] Create case error:', err);
      const msg = typeof err.message === 'string' ? err.message : 'An unknown error occurred. Check the browser console.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md">
      <div className="glass-modal w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/60 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/50">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Create Inbound Refill Request</h3>
              <p className="text-xs text-slate-500 font-medium">Simulate Surescripts / Pharmacy electronic intake transmission</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white/80 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Patient Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Date of Birth</label>
              <input
                type="date"
                required
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Medication Name</label>
              <input
                type="text"
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Dosage & Sig</label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Days Supply</label>
              <input
                type="number"
                value={daysSupply}
                onChange={(e) => setDaysSupply(Number(e.target.value))}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Refills Remaining</label>
              <input
                type="number"
                value={refillsRemaining}
                onChange={(e) => setRefillsRemaining(Number(e.target.value))}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs font-bold text-rose-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Dispensing Pharmacy</label>
              <select
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              >
                <option value="Downtown Pharmacy">Downtown Pharmacy</option>
                <option value="MetroCare Community Pharmacy">MetroCare Community Pharmacy</option>
                <option value="Walgreens #4192">Walgreens #4192</option>
                <option value="CVS Pharmacy #8821">CVS Pharmacy #8821</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Attending Provider</label>
              <select
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              >
                <option value="Dr. Sarah Wilson">Dr. Sarah Wilson (Internal Med)</option>
                <option value="Dr. Robert Chen">Dr. Robert Chen (Family Med)</option>
                <option value="Dr. Maria Alverez">Dr. Maria Alverez (Cardiology)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Primary Operational Blocker</label>
            <select
              value={forceBlocker}
              onChange={(e) => setForceBlocker(e.target.value)}
              className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs font-medium"
            >
              <option value="No refills remaining">No refills remaining (Provider authorization required)</option>
              <option value="Prior authorization required">Prior authorization required (Insurance / PBM)</option>
              <option value="Quantity clarification">Quantity clarification (Pharmacy clarification)</option>
              <option value="Missing patient information">Missing patient information (Information-related)</option>
              <option value="Patient visit may be required">Patient visit may be required (Clinical encounter)</option>
              <option value="EHR unavailable">EHR unavailable (Integration / gateway failure)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Clinical Notes & Details</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/70 border border-slate-200/80 rounded-xl p-2.5 text-xs focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:outline-none transition shadow-xs"
              placeholder="Include dispensing context or transmission parameters..."
            />
          </div>

          {/* AI Automated Pipeline Callout */}
          <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200/60 flex items-start gap-3 text-blue-900 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-blue-950">Automated AI Orchestration: </span>
              Upon submission, the case will enter <code className="bg-white/80 text-blue-800 px-1.5 py-0.5 rounded-full font-mono text-[11px] border border-blue-200">TRIAGING</code>, execute blocker detection, calculate operational SLA, and recommend optimal practice routing.
            </div>
          </div>

          {/* Inline Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50/80 border border-rose-300/60 text-xs text-rose-900 backdrop-blur-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-rose-800 mb-0.5">Submission Failed</div>
                <div className="font-medium leading-relaxed">{error}</div>
                <div className="text-[10px] text-rose-600 mt-1">Check browser console (F12) for full error details.</div>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 transition shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="apple-btn-secondary px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="apple-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Submitting & Triaging...</span>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Submit Refill Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
