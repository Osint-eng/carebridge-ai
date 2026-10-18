import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilitySettings {
  reducedMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface AccessibilityContextType extends AccessibilitySettings {
  setReducedMotion: (val: boolean) => void;
  setLargeText: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleReducedMotion: () => void;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('carebridge_reduced_motion');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem('carebridge_large_text') === 'true';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('carebridge_high_contrast') === 'true';
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('carebridge_theme') as any) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('carebridge_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('carebridge_large_text', String(largeText));
    if (largeText) {
      document.documentElement.classList.add('text-lg-mode');
    } else {
      document.documentElement.classList.remove('text-lg-mode');
    }
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem('carebridge_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('carebridge_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleReducedMotion = () => setReducedMotion((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        largeText,
        highContrast,
        theme,
        setReducedMotion,
        setLargeText,
        setHighContrast,
        setTheme,
        toggleReducedMotion,
        toggleLargeText,
        toggleHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
