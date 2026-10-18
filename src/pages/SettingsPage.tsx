import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAccessibility } from '@/context/AccessibilityContext';

export const SettingsPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const { reducedMotion, largeText, highContrast, toggleReducedMotion, toggleLargeText, toggleHighContrast } = useAccessibility();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Profile and accessibility preferences</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <p className="text-sm"><span className="text-slate-500">Name:</span> {profile?.fullName}</p>
        <p className="text-sm"><span className="text-slate-500">Email:</span> {profile?.email}</p>
        <p className="text-sm"><span className="text-slate-500">Role:</span> {profile?.role}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Accessibility</h2>
        <label className="flex items-center justify-between text-sm cursor-pointer">
          <span>Reduced motion</span>
          <input type="checkbox" checked={reducedMotion} onChange={toggleReducedMotion} className="accent-sky-500 w-4 h-4" />
        </label>
        <label className="flex items-center justify-between text-sm cursor-pointer">
          <span>Large text</span>
          <input type="checkbox" checked={largeText} onChange={toggleLargeText} className="accent-sky-500 w-4 h-4" />
        </label>
        <label className="flex items-center justify-between text-sm cursor-pointer">
          <span>High contrast</span>
          <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} className="accent-sky-500 w-4 h-4" />
        </label>
      </div>

      <button onClick={logout} className="px-4 py-2 bg-red-50 dark:bg-red-950 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100">
        Sign Out
      </button>
    </div>
  );
};
