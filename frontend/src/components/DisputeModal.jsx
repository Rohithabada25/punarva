import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function DisputeModal({
  isOpen,
  onClose,
  listingId,
  userRole = 'buyer',
  onDisputeRaised
}) {
  const [reason, setReason] = useState('wrong_quantity');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open & manage focus
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide a brief explanation of the problem.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.reportProblem(listingId, {
        role: userRole,
        reason,
        note: note.trim()
      });
      if (onDisputeRaised) {
        onDisputeRaised();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to report problem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 outline-hidden"
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 id="dispute-modal-title" className="text-sm font-bold text-red-950">Report an Exchange Conflict</h3>
              <p className="text-[11px] text-red-700">Routes exchange to Admin Dispute Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dispute modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Reason for Dispute
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-medium focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-hidden"
            >
              <option value="wrong_quantity">Wrong quantity delivered</option>
              <option value="no_show">No-show at arranged pickup window</option>
              <option value="not_as_described">Item not as described / damaged</option>
              <option value="other">Other issue or dispute</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Specific Complaint / Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain the issue clearly for administrator review..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-hidden resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Note: Raising a dispute transitions this listing to <strong>Disputed</strong> status. No environmental impact will be credited until resolved by the administrator.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting Report...' : 'Submit to Admin Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
