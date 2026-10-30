import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  FileSearch,
  HeartHandshake,
  ShieldCheck,
  Languages,
  BookOpenCheck,
  Refrigerator,
  CalendarClock,
  Volume2,
  FolderArchive,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Stethoscope,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocument } from '@/context/DocumentContext';
import { getNavForRole, roleTheme, type NavItemDef } from '@/lib/roleNav';

const ICONS: Record<NavItemDef['iconName'], React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileUp,
  FileSearch,
  HeartHandshake,
  ShieldCheck,
  Languages,
  BookOpenCheck,
  Refrigerator,
  CalendarClock,
  Volume2,
  FolderArchive,
  BarChart3,
  Settings,
  ShieldAlert,
  Users,
  ClipboardList,
};

export const Sidebar: React.FC = () => {
  const { profile, logout } = useAuth();
  const { currentDoc } = useDocument();
  const navigate = useNavigate();
  const theme = roleTheme(profile?.role);
  const navItems = getNavForRole(profile?.role);
  const sections = Array.from(new Set(navItems.map((i) => i.section)));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const badgeFor = (path: string) => {
    if (path === '/extraction' && currentDoc) return { text: 'Ready', color: 'sky' as const };
    if (path === '/faithfulness') {
      if (currentDoc?.faithfulnessReport?.overallStatus === 'VERIFIED')
        return { text: 'OK', color: 'emerald' as const };
      return { text: 'Check', color: 'sky' as const };
    }
    return null;
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20">
      <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center`}>
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">CareBridge</p>
          <p className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${theme.badge} inline-block mt-0.5`}>
            {theme.label}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {sections.map((section) => (
          <div key={section}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{section}</p>
            <div className="space-y-0.5">
              {navItems
                .filter((i) => i.section === section)
                .map((item) => {
                  const Icon = ICONS[item.iconName];
                  const badge = badgeFor(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            badge.color === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                          }`}
                        >
                          {badge.text}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center text-white text-xs font-bold`}>
            {(profile?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{profile?.fullName || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
};
