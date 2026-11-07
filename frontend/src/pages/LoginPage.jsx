import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  Building2,
  ShoppingBag,
  ShieldAlert,
  Globe,
  Lock,
  Mail,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { users, switchUser, login, register, language, changeLanguage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/';

  // Active tab: 'personas' | 'login' | 'register'
  const [activeTab, setActiveTab] = useState('personas');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('seller');
  const [regCity, setRegCity] = useState('Bapatla');
  const [regError, setRegError] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleSelectUser = async (user) => {
    await switchUser(user);
    navigate(destination, { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      if (!loginEmail.trim() || !loginPassword) {
        throw new Error('Please enter both email and password.');
      }
      await login(loginEmail.trim(), loginPassword);
      navigate(destination, { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    setRegLoading(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        city: regCity.trim() || 'Bapatla',
        preferred_language: language,
      });
      navigate(destination, { replace: true });
    } catch (err) {
      setRegError(err.message || 'Registration failed. Check if email already exists.');
    } finally {
      setRegLoading(false);
    }
  };

  const roleMeta = {
    seller: {
      title: 'Seller (Homeowner / Contractor)',
      desc: 'Upload material photo -> AI surveys quantity & condition -> RAG suggests reuse -> Matches buyers',
      icon: Leaf,
      color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
    },
    buyer: {
      title: 'Buyer (Builder / Student / DIY)',
      desc: 'Browse materials by distance & budget -> Honest condition info -> Make offers & pickup offline',
      icon: ShoppingBag,
      color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-400 text-blue-950',
      badge: 'bg-blue-600 text-white',
    },
    org: {
      title: 'College / NGO / Institution',
      desc: 'Free / low-cost surplus donations for lab testing, community shelters & vocational training',
      icon: Building2,
      color: 'border-purple-200 bg-purple-50/60 hover:bg-purple-50 hover:border-purple-400 text-purple-950',
      badge: 'bg-purple-600 text-white',
    },
    admin: {
      title: 'Administrator',
      desc: 'Mediate disputed exchanges, investigate quantity or condition conflicts & simulate 48h timeouts',
      icon: ShieldAlert,
      color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-400 text-amber-950',
      badge: 'bg-amber-600 text-white',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        
        {/* Brand Banner with Punarva Meaning Line */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-eco-700 text-white shadow-xl shadow-eco-700/20 mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
              <path d="M11 19h8.2a1.8 1.8 0 0 0 1.57-.88 1.79 1.79 0 0 0 .004-1.78L16.8 9.5" />
              <path d="M11 19V5a2 2 0 0 0-2-2H7" />
              <path d="m14 8-4-4 4-4" />
              <circle cx="12" cy="12" r="3" fill="#86efac" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Punarva
          </h1>
          <p className="mt-1 text-base font-bold text-eco-700">
            "Give every material a second life."
          </p>

          {/* Meaning of Punarva requirement */}
          <div className="mt-3 max-w-lg mx-auto p-3.5 rounded-xl bg-eco-50/90 border border-eco-200/80 text-xs text-eco-900 font-medium shadow-xs">
            <span className="font-bold">Origin & Meaning: </span>
            {t('brand.origin_meaning')}
          </div>
        </div>

        {/* Language Switcher Bar on Login */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">{t('login.language_label')}:</span>
          {[
            { code: 'en', label: 'English' },
            { code: 'te', label: 'తెలుగు' },
            { code: 'hi', label: 'हिन्दी' },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => changeLanguage(l.code)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                language === l.code
                  ? 'bg-eco-700 text-white ring-2 ring-eco-400'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Main Card with Tabs */}
        <div className="mt-6 bg-white py-6 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-8 border border-slate-200">
          
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'personas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-eco-600" />
              <span>Demo Personas (1-Click)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-eco-600" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-eco-600" />
              <span>Register</span>
            </button>
          </div>

          {/* TAB 1: 1-Click Demo Personas */}
          {activeTab === 'personas' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  {t('login.subtitle')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any pre-seeded persona around Bapatla & Guntur, AP to enter the platform instantly:
                </p>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {users.map((u) => {
                  const meta = roleMeta[u.role] || roleMeta['seller'];
                  const Icon = meta.icon;

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`group p-4 rounded-2xl border cursor-pointer transition-all ${meta.color} flex items-center justify-between shadow-xs hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-eco-800 transition-colors">
                              {u.name}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${meta.badge}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {u.city} • Preferred language: <span className="font-semibold uppercase">{u.preferred_language}</span>
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1 font-medium hidden sm:block">
                            {meta.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pl-3">
                        <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-eco-600 group-hover:text-white flex items-center justify-center transition-colors text-slate-400">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Demo accounts can also log in via email with password: <span className="font-mono font-bold text-slate-800">punarva123</span>
              </div>
            </div>
          )}

          {/* TAB 2: Sign In with Email & Password */}
          {activeTab === 'login' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Sign In to Punarva
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered credentials or any seeded demo email:
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. rajesh@punarva.demo"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password (demo: punarva123)"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-eco-700 text-white font-bold text-sm hover:bg-eco-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loginLoading ? 'Signing In...' : 'Sign In'}</span>
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('rajesh@punarva.demo');
                    setLoginPassword('punarva123');
                  }}
                  className="text-xs text-eco-700 hover:underline font-semibold"
                >
                  Quick fill: Rajesh Sharma (Seller demo)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Register New Account */}
          {activeTab === 'register' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Register for Punarva
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Join the circular material exchange network with encrypted credentials:
                </p>
              </div>

              {regError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Naidu"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium bg-white"
                    >
                      <option value="seller">Seller (Contractor / Homeowner)</option>
                      <option value="buyer">Buyer (Builder / Student / DIY)</option>
                      <option value="org">College / NGO / Institution</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g. Bapatla"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-eco-700 text-white font-bold text-sm hover:bg-eco-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{regLoading ? 'Creating Account...' : 'Create Account'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
