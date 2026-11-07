import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Bell,
  Check,
  Clock,
  Tag,
  Award,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { currentUser, triggerGlobalRefresh } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await api.getUserNotifications(currentUser.id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      triggerGlobalRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleMarkRead(n.id);
    }

    const listingId = n.params?.listing_id;

    if (n.type === 'offer_received') {
      navigate(listingId ? `/offers?listingId=${listingId}` : '/offers');
    } else if (n.type === 'offer_accepted' || n.type === 'offer_declined') {
      navigate(listingId ? `/my-offers?listingId=${listingId}` : '/my-offers');
    } else if (n.type === 'pickup_proposed') {
      if (currentUser?.role === 'seller') {
        navigate(listingId ? `/offers?listingId=${listingId}` : '/offers');
      } else {
        navigate(listingId ? `/my-offers?listingId=${listingId}` : '/my-offers');
      }
    } else if (n.type === 'pickup_arranged') {
      if (currentUser?.role === 'seller') {
        navigate(listingId ? `/offers?listingId=${listingId}` : '/offers');
      } else {
        navigate(listingId ? `/my-offers?listingId=${listingId}` : '/my-offers');
      }
    } else if (n.type === 'exchange_completed') {
      navigate('/impact');
    } else if (n.type === 'dispute_reported' || n.type === 'dispute_resolved') {
      if (currentUser?.role === 'admin') {
        navigate('/admin');
      } else if (currentUser?.role === 'seller') {
        navigate(listingId ? `/offers?listingId=${listingId}` : '/offers');
      } else {
        navigate(listingId ? `/my-offers?listingId=${listingId}` : '/my-offers');
      }
    } else {
      navigate('/');
    }
  };

  const typeIcons = {
    offer_received: Tag,
    offer_accepted: CheckCircle2,
    offer_declined: Tag,
    pickup_proposed: Calendar,
    pickup_arranged: Calendar,
    exchange_completed: Award,
    dispute_reported: ShieldAlert,
    dispute_resolved: ShieldAlert,
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 lg:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-eco-600" />
          <span>In-App Notifications</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          Click any notification to navigate directly to the listing or transaction.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-600 font-medium">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const timeStr = new Date(n.created_at).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const Icon = typeIcons[n.type] || Bell;
            const message = t(n.message_key, n.params || {});

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer group hover:shadow-md ${
                  n.is_read
                    ? 'bg-white border-slate-200/90 hover:border-slate-300'
                    : 'bg-eco-50/70 border-eco-300 ring-1 ring-eco-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-eco-100 text-eco-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {!n.is_read && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-eco-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-900 font-bold leading-relaxed group-hover:text-eco-900 transition-colors">
                      {message}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {timeStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-eco-700 hover:bg-eco-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-eco-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
