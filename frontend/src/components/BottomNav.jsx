import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Recycle, UploadCloud, Search, Tag, Award, User, LogIn } from 'lucide-react';

export default function BottomNav() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const links = [
    { to: '/', label: 'Home', icon: Recycle },
    { to: '/upload', label: 'Upload', icon: UploadCloud },
    { to: '/browse', label: 'Browse', icon: Search },
    { to: '/offers', label: 'Offers', icon: Tag },
    { to: '/impact', label: 'Impact', icon: Award },
    {
      to: currentUser ? '/settings' : '/login',
      label: currentUser ? 'Profile' : 'Sign In',
      icon: currentUser ? User : LogIn,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom">
      <div className="grid grid-cols-6 h-14">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 transition-colors ${
                  isActive
                    ? 'text-eco-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
