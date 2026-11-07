import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  Play,
  User,
  MapPin,
  Calendar
} from 'lucide-react';

export default function AdminDisputesPage() {
  const { t } = useTranslation();
  const { currentUser, refreshKey, triggerGlobalRefresh } = useAuth();

  const [disputes, setDisputes] = useState([]);
  const [activePickups, setActivePickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadDisputesAndPickups = async () => {
    try {
      setLoading(true);
      const [disputeList, allListings] = await Promise.all([
        api.getAdminDisputes(),
        api.getListings({ status_filter: 'pickup_arranged' })
      ]);
      setDisputes(disputeList);
      setActivePickups(allListings);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputesAndPickups();
  }, [refreshKey]);

  const handleResolve = async (listingId, action) => {
    try {
      setActionLoading(true);
      await api.resolveDispute(listingId, {
        action,
        admin_note: adminNote.trim() || `Administrator mediated resolution: ${action}.`
      });

      setStatusMessage(`Dispute successfully resolved with action: ${action}`);
      setAdminNote('');
      setSelectedDispute(null);
      triggerGlobalRefresh();
      loadDisputesAndPickups();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      alert('Error resolving dispute: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateTimeout = async (listingId) => {
    try {
      setActionLoading(true);
      await api.simulateTimeout(listingId);
      setStatusMessage('Simulated 48-Hour SLA timeout successfully triggered! Listing moved to disputed.');
      triggerGlobalRefresh();
      loadDisputesAndPickups();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      alert('Error simulating timeout: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading dispute center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('admin.title')}
            </h1>
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Admin Access
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SECTION 1: ACTIVE DISPUTES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>{t('admin.active_disputes')} ({disputes.length})</span>
          </h2>
          <span className="text-xs text-slate-400">No impact calculated while disputed</span>
        </div>

        {disputes.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-400 italic">
            No active disputes currently. All exchanges are proceeding smoothly!
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-3xl border border-red-200 p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-200">
                        DISPUTE #{d.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Reason: <strong className="text-red-700">{d.dispute_reason}</strong>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{d.title}</h3>
                    <p className="text-xs text-slate-500">
                      Seller: {d.seller_name} ({d.seller_city}) • Qty: {d.quantity} {d.unit} • Listed: ₹{d.price}
                    </p>
                  </div>

                  {/* Dual confirmations at time of dispute */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      d.seller_confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      Seller: {d.seller_confirmed ? 'Confirmed' : 'Unconfirmed'}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      d.buyer_confirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      Buyer: {d.buyer_confirmed ? 'Confirmed' : 'Unconfirmed'}
                    </span>
                  </div>
                </div>

                {/* Complaint statement */}
                <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1">
                  <p className="text-[11px] font-bold text-red-900 uppercase">
                    Complainant Statement:
                  </p>
                  <p className="text-xs text-red-950 font-medium italic">
                    "{d.dispute_note || 'Condition / quantity discrepancy reported during handover.'}"
                  </p>
                </div>

                {/* Administrator Mediation Controls */}
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Mediation Notes / Agreed Terms:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spoke to both parties; seller agrees to 15% discount for broken corners."
                      value={selectedDispute === d.id ? adminNote : ''}
                      onChange={(e) => {
                        setSelectedDispute(d.id);
                        setAdminNote(e.target.value);
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {/* Action 1: Reject Report (resume pickup) */}
                    <button
                      onClick={() => handleResolve(d.id, 'reject')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                    >
                      {t('admin.action_reject')}
                    </button>

                    {/* Action 2: Cancel Exchange (return to listed) */}
                    <button
                      onClick={() => handleResolve(d.id, 'cancel')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      {t('admin.action_cancel')}
                    </button>

                    {/* Action 3: Mark Completed & Calculate Impact */}
                    <button
                      onClick={() => handleResolve(d.id, 'complete')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      {t('admin.action_complete')}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: DEMO 48-HOUR SLA TIMEOUT SIMULATION TOOL */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Demo Simulation: 48-Hour Non-Response Conflict
            </h3>
            <p className="text-xs text-slate-400">
              Test conflict workflow when one party confirms handover but the other party has not responded within the 48-hour SLA window.
            </p>
          </div>
        </div>

        {activePickups.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No listings currently in 'pickup_arranged' status to simulate.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-300 font-semibold">
              Select an active exchange to simulate SLA expiration:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePickups.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-slate-400">
                      Seller: {p.seller_name} • Date: {p.pickup_date}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSimulateTimeout(p.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 shadow-sm flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate Timeout</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
