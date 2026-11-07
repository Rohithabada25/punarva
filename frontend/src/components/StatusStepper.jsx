import React from 'react';
import { Check, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StatusStepper({
  status = 'listed',
  sellerConfirmed = false,
  buyerConfirmed = false,
  disputeReason = null,
  disputeNote = null,
  pickupProposedBy = null,
}) {
  const steps = [
    { key: 'listed', label: 'Listed' },
    { key: 'accepted', label: 'Offer Accepted' },
    { key: 'pickup_proposed', label: 'Pickup Proposed' },
    { key: 'pickup_arranged', label: 'Pickup Arranged' },
    { key: 'completed', label: 'Completed' },
  ];

  const statusOrder = {
    draft: 0,
    listed: 1,
    offer_received: 1,
    accepted: 2,
    pickup_proposed: 3,
    pickup_arranged: 4,
    completed: 5,
  };

  const isDisputed = status === 'disputed';
  const currentStepIndex = statusOrder[status] || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6">
      
      {/* Dispute Alert Banner if status is disputed */}
      {isDisputed && (
        <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
                DISPUTED / PENDING MEDIATION
              </span>
              <span className="text-xs font-semibold">Reason: {disputeReason || 'Unresolved conflict'}</span>
            </div>
            {disputeNote && (
              <p className="text-xs text-red-700 mt-1 italic font-medium">
                "{disputeNote}"
              </p>
            )}
            <p className="text-[11px] text-red-600 mt-2">
              Exchange is paused. No impact is counted. Referred to Administrator review.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStepIndex > stepNum || status === 'completed';
            const isCurrent = currentStepIndex === stepNum && !isDisputed;

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-eco-600 text-white shadow-eco-600/20'
                      : isCurrent
                      ? 'bg-white border-2 border-eco-600 text-eco-700 ring-4 ring-eco-100 animate-pulse'
                      : isDisputed && step.key === 'pickup_arranged'
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold leading-tight ${
                    isCompleted
                      ? 'text-slate-900'
                      : isCurrent
                      ? 'text-eco-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Negotiation Note when Pickup Proposed */}
      {status === 'pickup_proposed' && !isDisputed && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Pickup Schedule Negotiation:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Proposed by {pickupProposedBy === 'buyer' ? 'Buyer' : 'Seller'} • Awaiting agreement
          </span>
        </div>
      )}

      {/* Dual Confirmation Badges */}
      {(status === 'pickup_arranged' || status === 'completed' || isDisputed) && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-700 font-bold">
            Dual Handover Verification:
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                sellerConfirmed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-300'
              }`}
            >
              {sellerConfirmed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              )}
              {sellerConfirmed ? 'Seller Confirmed' : 'Seller Confirmation Pending'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                buyerConfirmed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-300'
              }`}
            >
              {buyerConfirmed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              )}
              {buyerConfirmed ? 'Buyer Confirmed' : 'Buyer Confirmation Pending'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
