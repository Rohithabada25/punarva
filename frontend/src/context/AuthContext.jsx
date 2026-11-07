import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load all seeded users and restore active session if present
  useEffect(() => {
    async function initAuth() {
      try {
        const userList = await api.getUsers();
        setUsers(userList);

        const savedUserId = localStorage.getItem('punarva_user_id');
        const token = localStorage.getItem('punarva_token');

        if (savedUserId) {
          const parsedId = parseInt(savedUserId, 10);
          let matched = userList.find((u) => u.id === parsedId);

          if (!matched) {
            try {
              matched = await api.getUser(parsedId);
            } catch (err) {
              console.warn('Could not fetch stored user by id:', err);
            }
          }

          if (matched) {
            setCurrentUser(matched);
            if (matched.preferred_language) {
              i18n.changeLanguage(matched.preferred_language);
              localStorage.setItem('punarva_lang', matched.preferred_language);
            }
          } else {
            // Invalid/stale user id in localStorage, clear it
            localStorage.removeItem('punarva_user_id');
            localStorage.removeItem('punarva_token');
            setCurrentUser(null);
          }
        } else {
          // No user stored -> prompt login
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [i18n]);

  // Load unread notifications for current user
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnread() {
      try {
        const notifs = await api.getUserNotifications(currentUser.id);
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.warn('Failed to load notifications count:', err);
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [currentUser, refreshKey]);

  // 1-Click persona switch for demo evaluation
  const switchUser = async (user) => {
    try {
      const res = await api.switchPersona(user.id);
      localStorage.setItem('punarva_user_id', res.user.id.toString());
      localStorage.setItem('punarva_token', res.token);
      setCurrentUser(res.user);

      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      setRefreshKey((prev) => prev + 1);
      return res.user;
    } catch (err) {
      // Fallback local switch if network failure
      localStorage.setItem('punarva_user_id', user.id.toString());
      setCurrentUser(user);
      if (user.preferred_language) {
        changeLanguage(user.preferred_language);
      }
      setRefreshKey((prev) => prev + 1);
      return user;
    }
  };

  // Email and password login
  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('punarva_user_id', res.user.id.toString());
    localStorage.setItem('punarva_token', res.token);
    setCurrentUser(res.user);

    if (res.user.preferred_language) {
      changeLanguage(res.user.preferred_language);
    }
    setRefreshKey((prev) => prev + 1);
    return res.user;
  };

  // Registration
  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('punarva_user_id', res.user.id.toString());
    localStorage.setItem('punarva_token', res.token);
    setCurrentUser(res.user);

    // Refresh user list
    const updatedUsers = await api.getUsers();
    setUsers(updatedUsers);

    if (res.user.preferred_language) {
      changeLanguage(res.user.preferred_language);
    }
    setRefreshKey((prev) => prev + 1);
    return res.user;
  };

  // Logout - clears all stored credentials and session
  const logout = () => {
    localStorage.removeItem('punarva_user_id');
    localStorage.removeItem('punarva_token');
    setCurrentUser(null);
    setUnreadCount(0);
  };

  // Update profile
  const updateProfile = async (updateData) => {
    if (!currentUser) return null;
    const updated = await api.updateUserProfile(currentUser.id, updateData);
    setCurrentUser(updated);

    // Update in user list as well
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    if (updated.preferred_language && updated.preferred_language !== i18n.language) {
      changeLanguage(updated.preferred_language);
    }
    setRefreshKey((prev) => prev + 1);
    return updated;
  };

  // Language change
  const changeLanguage = async (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('punarva_lang', newLang);
    if (currentUser) {
      try {
        await api.updateUserLanguage(currentUser.id, newLang);
        setCurrentUser((prev) => (prev ? { ...prev, preferred_language: newLang } : null));
      } catch (err) {
        console.warn('Could not persist language to user profile:', err);
      }
    }
  };

  const triggerGlobalRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        login,
        register,
        logout,
        switchUser,
        updateProfile,
        language: i18n.language,
        changeLanguage,
        unreadCount,
        triggerGlobalRefresh,
        refreshKey,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
