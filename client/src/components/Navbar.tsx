import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-brand-400" />
        <span className="text-sm font-bold text-slate-200">CretivRank <span className="text-brand-400 font-medium">by Cretivra</span> — Enterprise Assessment Suite</span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.name}</div>
              <div className="text-[10px] text-brand-400 font-mono tracking-wide uppercase">{user.role}</div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
