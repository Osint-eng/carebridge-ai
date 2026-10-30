import type { UserRole } from '@/types';

export type NavItemDef = {
  label: string;
  path: string;
  iconName:
    | 'LayoutDashboard'
    | 'FileUp'
    | 'FileSearch'
    | 'HeartHandshake'
    | 'ShieldCheck'
    | 'Languages'
    | 'BookOpenCheck'
    | 'Refrigerator'
    | 'CalendarClock'
    | 'Volume2'
    | 'FolderArchive'
    | 'BarChart3'
    | 'Settings'
    | 'ShieldAlert'
    | 'Users'
    | 'ClipboardList';
  section: string;
};

export function getNavForRole(role: UserRole | undefined): NavItemDef[] {
  const r = role || 'Patient';

  const patientHome: NavItemDef[] = [
    { label: 'My Dashboard', path: '/dashboard', iconName: 'LayoutDashboard', section: 'Home' },
    { label: 'My Care Plan', path: '/care-plan', iconName: 'HeartHandshake', section: 'My plan' },
    { label: 'Fridge Sheet', path: '/fridge-sheet', iconName: 'Refrigerator', section: 'My plan' },
    { label: 'Medicine Schedule', path: '/medicine-timetable', iconName: 'CalendarClock', section: 'My plan' },
    { label: 'Listen (Audio)', path: '/audio', iconName: 'Volume2', section: 'My plan' },
    { label: 'Language', path: '/translation', iconName: 'Languages', section: 'My plan' },
    { label: 'Easy to Read?', path: '/readability', iconName: 'BookOpenCheck', section: 'My plan' },
    { label: 'Settings', path: '/settings', iconName: 'Settings', section: 'Account' },
  ];

  const caregiverHome: NavItemDef[] = [
    { label: 'Caregiver Home', path: '/dashboard', iconName: 'LayoutDashboard', section: 'Home' },
    { label: 'Family Care Plan', path: '/care-plan', iconName: 'HeartHandshake', section: 'Support' },
    { label: 'Fridge Sheet', path: '/fridge-sheet', iconName: 'Refrigerator', section: 'Support' },
    { label: 'Medicine Schedule', path: '/medicine-timetable', iconName: 'CalendarClock', section: 'Support' },
    { label: 'Audio for Family', path: '/audio', iconName: 'Volume2', section: 'Support' },
    { label: 'Translate Plan', path: '/translation', iconName: 'Languages', section: 'Support' },
    { label: 'Documents', path: '/documents', iconName: 'FolderArchive', section: 'Records' },
    { label: 'Settings', path: '/settings', iconName: 'Settings', section: 'Account' },
  ];

  const staffHome: NavItemDef[] = [
    { label: 'Staff Dashboard', path: '/dashboard', iconName: 'LayoutDashboard', section: 'Clinical' },
    { label: 'Upload Summary', path: '/upload', iconName: 'FileUp', section: 'Clinical' },
    { label: 'Extraction', path: '/extraction', iconName: 'FileSearch', section: 'Clinical' },
    { label: 'Generate Care Plan', path: '/care-plan', iconName: 'HeartHandshake', section: 'Clinical' },
    { label: 'Faithfulness Audit', path: '/faithfulness', iconName: 'ShieldCheck', section: 'Clinical' },
    { label: 'Verification inbox', path: '/verification-inbox', iconName: 'ClipboardList', section: 'Clinical' },
    { label: 'Translation Check', path: '/translation', iconName: 'Languages', section: 'Clinical' },
    { label: 'Readability', path: '/readability', iconName: 'BookOpenCheck', section: 'Clinical' },
    { label: 'Document Library', path: '/documents', iconName: 'FolderArchive', section: 'Records' },
    { label: 'Quality Analytics', path: '/analytics', iconName: 'BarChart3', section: 'Records' },
    { label: 'Settings', path: '/settings', iconName: 'Settings', section: 'Account' },
  ];

  const adminHome: NavItemDef[] = [
    ...staffHome.filter((i) => i.path !== '/settings'),
    { label: 'Admin Console', path: '/admin', iconName: 'ShieldAlert', section: 'Admin' },
    { label: 'System Settings', path: '/settings', iconName: 'Settings', section: 'Admin' },
  ];

  if (r === 'Patient') return patientHome;
  if (r === 'Caregiver') return caregiverHome;
  if (r === 'Healthcare Staff') return staffHome;
  if (r === 'Administrator') return adminHome;
  return patientHome;
}

export function roleTheme(role: UserRole | undefined): {
  accent: string;
  badge: string;
  label: string;
  subtitle: string;
} {
  switch (role) {
    case 'Caregiver':
      return {
        accent: 'from-violet-500 to-purple-600',
        badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
        label: 'Caregiver',
        subtitle: 'Supporting a family member\u2019s recovery',
      };
    case 'Healthcare Staff':
      return {
        accent: 'from-sky-500 to-cyan-600',
        badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
        label: 'Healthcare Staff',
        subtitle: 'Clinical extraction & faithfulness workflow',
      };
    case 'Administrator':
      return {
        accent: 'from-amber-500 to-orange-600',
        badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
        label: 'Administrator',
        subtitle: 'System oversight & quality control',
      };
    default:
      return {
        accent: 'from-teal-500 to-emerald-600',
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
        label: 'Patient',
        subtitle: 'Your personal discharge care plan',
      };
  }
}

export function allowedPathsForRole(role: UserRole | undefined): string[] {
  return getNavForRole(role).map((i) => i.path);
}
