import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  Upload,
  FileCheck2,
  UserCheck,
  Award,
  ShieldAlert,
  Mic,
  BarChart3,
  History,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Logo } from './Logo';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Question Bank', path: '/admin/questions', icon: HelpCircle, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'] },
    { name: 'Bulk Upload', path: '/admin/upload', icon: Upload, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Assessments', path: '/admin/assessments', icon: FileCheck2, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Invitations', path: '/admin/invitations', icon: UserCheck, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Candidate Results', path: '/admin/results', icon: Award, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'] },
    { name: 'Interviews', path: '/admin/interviews', icon: Mic, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'INTERVIEWER'] },
    { name: 'Analytics & Export', path: '/admin/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <Logo size="sm" showSubtitle={true} />
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Security Info Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited & Encrypted</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Strict Server-Authoritative Timer & No Negative Marking Engine active.
          </p>
        </div>
      </div>
    </aside>
  );
};
