import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { PlusCircle, Search, Building2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WantedRequestsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [budget, setBudget] = useState(1500);
  const [isOrg, setIsOrg] = useState(currentUser?.role === 'org');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await api.getUserRequests(currentUser.id);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!material.trim()) return;
    try {
      setSubmitting(true);
      setError('');
      await api.createRequest({
        buyer_id: currentUser.id,
        material: material.trim(),
        quantity: parseFloat(quantity) || 1,
        budget: parseFloat(budget) || 0,
        is_org: isOrg,
      });

      setMessage('Wanted request registered! Matching Agent will alert you when materials are listed.');
      setMaterial('');
      setQuantity(50);
      setBudget(1500);
      loadRequests();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Buyer Wanted Requests
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Can't find what you need? Register a request and our AI Matching Agent will automatically notify sellers and link you to new salvage listings.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-eco-600" />
          <span>Post a New Material Request</span>
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Material Needed
            </label>
            <input
              type="text"
              placeholder="e.g. Red clay bricks, TMT rebars, PVC pipes, Teak wood"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Max Budget (₹)
            </label>
            <input
              type="number"
              step="any"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isOrgWanted"
              checked={isOrg}
              onChange={(e) => setIsOrg(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300"
            />
            <label htmlFor="isOrgWanted" className="text-xs font-bold text-slate-700 cursor-pointer">
              College / NGO Need
            </label>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {submitting ? 'Registering...' : 'Save Wanted Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Your Active Requests ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 italic">
            You don't have any saved requests yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{r.material}</span>
                    {r.is_org && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        NGO / College
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Qty: <strong>{r.quantity}</strong> • Budget: <strong>₹{r.budget}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registered in Matching Registry</span>
                  <button
                    onClick={() => navigate(`/browse?material=${encodeURIComponent(r.material)}`)}
                    className="text-eco-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Search Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
