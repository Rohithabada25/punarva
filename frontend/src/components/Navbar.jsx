import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Recycle,
  UploadCloud,
  Search,
  Tag,
  Award,
  ShieldAlert,
  Bell,
  Globe,
  User,
  ChevronDown,
  CheckCircle,
  Menu,
  X,
  Settings,
  LogOut,
  Users,
  LogIn
} from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const { currentUser, users, switchUser, logout, language, changeLanguage, unreadCount, triggerGlobalRefresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const userRef = useRef(null);

  // Fetch recent notifications when notification panel opens
  useEffect(() => {
    if (!notifPanelOpen || !currentUser) return;
    async function fetchRecent() {
      try {
        const notifs = await api.getUserNotifications(currentUser.id);
        setRecentNotifs(notifs.slice(0, 6));
      } catch (err) {
        console.warn('Could not load recent notifications:', err);
      }
    }
    fetchRecent();
  }, [notifPanelOpen, currentUser]);

  // Handle outside click & Esc key for menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotifPanelOpen(false);
        setUserMenuOpen(false);
        setLangMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifPanelOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (notifPanelOpen || langMenuOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [notifPanelOpen, langMenuOpen, userMenuOpen]);

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.markNotificationRead(n.id);
        triggerGlobalRefresh();
      } catch (err) {
        console.warn(err);
      }
    }
    setNotifPanelOpen(false);

    const listingId = n.params?.listing_id;
    if (n.type === 'offer_received') {
      navigate(listingId ? `/offers?listingId=${listingId}` : '/offers');
    } else if (n.type === 'offer_accepted' || n.type === 'offer_declined') {
      navigate(listingId ? `/my-offers?listingId=${listingId}` : '/my-offers');
    } else if (n.type === 'pickup_proposed' || n.type === 'pickup_arranged') {
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
      navigate('/notifications');
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = currentUser ? [
    { to: '/', label: t('nav.dashboard'), icon: Recycle },
    { to: '/upload', label: t('nav.upload'), icon: UploadCloud },
    { to: '/browse', label: t('nav.browse'), icon: Search },
    { to: '/offers', label: t('nav.my_offers'), icon: Tag },
    { to: '/impact', label: t('nav.impact'), icon: Award },
  ] : [];

  if (currentUser?.role === 'admin') {
    navLinks.push({ to: '/admin', label: t('nav.admin'), icon: ShieldAlert, badge: true });
  }

  const roleColors = {
    seller: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    buyer: 'bg-blue-100 text-blue-800 border-blue-300',
    org: 'bg-purple-100 text-purple-800 border-purple-300',
    admin: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-eco-700 flex items-center justify-center shadow-md shadow-eco-700/20 group-hover:bg-eco-600 transition-colors">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                <path d="M11 19h8.2a1.8 1.8 0 0 0 1.57-.88 1.79 1.79 0 0 0 .004-1.78L16.8 9.5" />
                <path d="M11 19V5a2 2 0 0 0-2-2H7" />
                <path d="m14 8-4-4 4-4" />
                <circle cx="12" cy="12" r="3" fill="#86efac" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-eco-700 transition-colors">
                  Punarva
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-eco-100 text-eco-800 border border-eco-200">
                  AI Reuse
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Give every material a second life
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-eco-50 text-eco-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-eco-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Notifications, Language, User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Button & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifPanelOpen(!notifPanelOpen);
                  setUserMenuOpen(false);
                  setLangMenuOpen(false);
                }}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
                title={t('nav.notifications')}
                aria-label={t('nav.notifications')}
                aria-haspopup="dialog"
                aria-expanded={notifPanelOpen}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifPanelOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Panel Header with Close Button */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-eco-700" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        {t('nav.notifications')}
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifPanelOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      aria-label="Close notification panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notification items */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {recentNotifs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        {t('nav.no_notifications', 'No notifications yet.')}
                      </div>
                    ) : (
                      recentNotifs.map((n) => {
                        const timeStr = new Date(n.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const message = t(n.message_key, n.params || {});
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotifClick(n)}
                            className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-slate-50 ${
                              !n.is_read ? 'bg-eco-50/40' : ''
                            }`}
                          >
                            <div className="mt-1 shrink-0">
                              <span className={`w-2 h-2 rounded-full inline-block ${!n.is_read ? 'bg-eco-600' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'text-slate-700'} line-clamp-2 leading-relaxed`}>
                                {message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">{timeStr}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifPanelOpen(false)}
                      className="text-xs font-bold text-eco-700 hover:text-eco-800 transition-colors inline-flex items-center gap-1"
                    >
                      <span>View All Notifications</span>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => {
                  setLangMenuOpen(!langMenuOpen);
                  setUserMenuOpen(false);
                  setNotifPanelOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={langMenuOpen}
                aria-label={t('login.language_label', 'Interface Language')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm focus:outline-none"
              >
                <Globe className="w-3.5 h-3.5 text-eco-600" />
                <span className="uppercase font-semibold">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t('login.language_label')}
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { changeLanguage(l.code); setLangMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        language === l.code
                          ? 'bg-eco-50 text-eco-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{l.native}</span>
                      {language === l.code && <CheckCircle className="w-3.5 h-3.5 text-eco-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Dropdown or Sign In Button */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setLangMenuOpen(false);
                    setNotifPanelOpen(false);
                  }}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  aria-label="User profile and persona menu"
                  className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border text-xs font-medium transition-all shadow-sm focus:outline-none ${
                    roleColors[currentUser.role || 'seller']
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-slate-700 shadow-inner">
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold leading-tight truncate max-w-[100px]">{currentUser.name}</p>
                    <p className="text-[10px] opacity-80 uppercase leading-none">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Identity Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Role: {currentUser.role}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {currentUser.city}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="px-2 py-1.5 border-b border-slate-100">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Settings & Profile</span>
                      </Link>
                    </div>

                    {/* Demo Persona Switcher */}
                    <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Switch Demo Persona:</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto px-2 space-y-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { switchUser(u); setUserMenuOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-left transition-colors ${
                            currentUser?.id === u.id
                              ? 'bg-eco-50 text-eco-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            u.role === 'seller' ? 'bg-emerald-500' :
                            u.role === 'buyer' ? 'bg-blue-500' :
                            u.role === 'org' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                          <div className="flex-1 truncate">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{u.role} • {u.city}</p>
                          </div>
                          {currentUser?.id === u.id && (
                            <CheckCircle className="w-3.5 h-3.5 text-eco-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Logout Option */}
                    <div className="border-t border-slate-100 mt-2 pt-1.5 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-eco-50 text-eco-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-eco-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {currentUser ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span>{t('nav.notifications')}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span>Settings & Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span>Logout ({currentUser.name})</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-eco-700 text-white font-bold text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Select Persona</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
