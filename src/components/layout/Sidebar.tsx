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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/context/DocumentContext';

export const Sidebar: React.FC = () => {
  const { profile, logout } = useAuth();
  const { currentDoc } = useDocuments();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const workflowItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload Summary', path: '/upload', icon: FileUp },
    { label: 'Extraction', path: '/extraction', icon: FileSearch, badge: currentDoc ? 'Ready' : undefined },
    { label: 'Care Plan', path: '/care-plan', icon: HeartHandshake },
    {
      label: 'Faithfulness Audit',
      path: '/faithfulness',
      icon: ShieldCheck,
      badge: currentDoc?.faithfulnessReport?.overallStatus === 'VERIFIED' ? '100%' : 'Verify',
      badgeColor: currentDoc?.faithfulnessReport?.overallStatus === 'VERIFIED' ? 'emerald' : 'sky',
    },
  ];

  const patientTools = [
    { label: 'Multilingual Plan', path: '/translation', icon: Languages },
    { label: 'Readability Score', path: '/readability', icon: BookOpenCheck },
    { label: 'Fridge Sheet', path: '/fridge-sheet', icon: Refrigerator },
    { label: 'Medicine Schedule', path: '/medicine-timetable', icon: CalendarClock },
    { label: 'Audio Care Plan', path: '/audio', icon: Volume2 },
  ];

  const adminTools = [
    { label: 'Document Library', path: '/documents', icon: FolderArchive },
    { label: 'Quality Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'System Settings', path: '/settings', icon: Settings },
  ];

  if (profile?.role === 'Administrator') {
    adminTools.push({ label: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  const NavItem = ({ item }: { item: any }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-medical-50 text-medical-700 dark:bg-medical-950/50 dark:text-medical-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            item.badgeColor === 'emerald'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
          }`}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20">
      <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">CareBridge</p>
          <p className="text-[10px] text-slate-400 font-medium">AI Clinical Bridge</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workflow</p>
          <div className="space-y-0.5">
            {workflowItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Tools</p>
          <div className="space-y-0.5">
            {patientTools.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Management</p>
          <div className="space-y-0.5">
            {adminTools.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-medical-100 dark:bg-medical-900/50 flex items-center justify-center text-xs font-bold text-medical-700 dark:text-medical-300">
            {(profile?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {profile?.fullName || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{profile?.role || 'Patient'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
