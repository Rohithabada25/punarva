import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  User,
  MapPin,
  Shield,
  Globe,
  Lock,
  LogOut,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { currentUser, updateProfile, logout, users, switchUser, language, changeLanguage } = useAuth();
  const navigate = useNavigate();

  // Profile form state
  const [name, setName] = useState(currentUser?.name || '');
  const [city, setCity] = useState(currentUser?.city || 'Bapatla');
  const [role, setRole] = useState(currentUser?.role || 'seller');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Switch persona modal/drawer state
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('Name cannot be blank');
      }

      await updateProfile({
        name: name.trim(),
        city: city.trim(),
        role: role,
      });

      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwLoading(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(null), 4000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password. Verify your current password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    seller: 'Seller (Homeowner / Contractor)',
    buyer: 'Buyer (Contractor / Student / DIY)',
    org: 'College / NGO / Institution',
    admin: 'Administrator (Disputes & Verification)',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Account Settings & Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your personal credentials, circular trading role, and language preferences.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 text-sm font-semibold transition-colors shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Profile Badge & Quick Persona Switcher */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center">
            <div className="w-20 h-20 rounded-2xl bg-eco-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md shadow-eco-600/20">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {currentUser?.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {currentUser?.email}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-eco-100 text-eco-800 border border-eco-200">
              <Shield className="w-3.5 h-3.5 text-eco-600" />
              <span>{currentUser?.role}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.city}, Andhra Pradesh</span>
            </div>
          </div>

          {/* Quick Demo Switcher Card */}
          <div className="bg-eco-50/70 rounded-2xl border border-eco-200/80 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-eco-900 font-bold text-sm">
              <Users className="w-4 h-4 text-eco-700" />
              <span>Switch Demo Persona</span>
            </div>
            <p className="text-xs text-eco-800/80 mt-1">
              Easily evaluate seller, buyer, institution or admin capabilities for the hackathon.
            </p>

            <button
              onClick={() => setShowPersonaPicker(!showPersonaPicker)}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-white border border-eco-300 text-eco-900 text-xs font-bold hover:bg-eco-100 transition-colors shadow-xs flex items-center justify-between"
            >
              <span>{showPersonaPicker ? 'Hide Personas' : 'Choose Another Persona'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-eco-700" />
            </button>

            {showPersonaPicker && (
              <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pt-2 border-t border-eco-200/60">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setName(u.name);
                      setCity(u.city);
                      setRole(u.role);
                      setShowPersonaPicker(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      currentUser?.id === u.id
                        ? 'bg-eco-700 text-white font-bold'
                        : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold truncate max-w-[150px]">{u.name}</p>
                      <p className="text-[10px] opacity-80 uppercase">{u.role} • {u.city}</p>
                    </div>
                    {currentUser?.id === u.id && (
                      <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Profile Form & Password Form */}
        <div className="md:col-span-2 space-y-6">

          {/* Profile Details Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <User className="w-5 h-5 text-eco-600" />
              <h3 className="text-base font-bold text-slate-900">
                Personal Information
              </h3>
            </div>

            {profileMsg && (
              <div
                className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Identity)
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary City / Town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                    placeholder="e.g. Bapatla, Guntur, Chirala"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Platform Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium bg-white"
                  >
                    <option value="seller">Seller (Homeowner / Contractor)</option>
                    <option value="buyer">Buyer (DIY / Builder)</option>
                    <option value="org">College / NGO / Institution</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Preferred Interface Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
                    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => changeLanguage(l.code)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        language === l.code
                          ? 'bg-eco-700 text-white border-eco-700 ring-2 ring-eco-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{l.native}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eco-700 text-white font-bold text-sm hover:bg-eco-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Lock className="w-5 h-5 text-eco-600" />
              <h3 className="text-base font-bold text-slate-900">
                Security & Password
              </h3>
            </div>

            {pwMsg && (
              <div
                className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  pwMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {pwMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{pwMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (demo: punarva123)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="New secure password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{pwLoading ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
