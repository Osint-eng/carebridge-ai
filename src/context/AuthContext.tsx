import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  /** Password step — may return requiresMfa: true without granting a session */
  login: (
    email: string,
    password: string
  ) => Promise<{ error?: string; user?: any; requiresMfa?: boolean; email?: string }>;
  /** MFA step — required after successful password verification */
  verifyMfa: (pin: string) => Promise<{ error?: string; user?: any }>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
    preferredLanguage: 'English' | 'Telugu' | 'Hindi' | 'Tamil',
    mfaPin: string
  ) => Promise<{ error?: string; user?: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mapUserToProfile = (u: any): UserProfile => {
    const meta = u?.user_metadata || {};
    return {
      id: u?.id || 'guest',
      email: u?.email || '',
      fullName: meta.full_name || meta.fullName || (u?.email ? u.email.split('@')[0] : ''),
      role: (meta.role as UserRole) || 'Patient',
      preferredLanguage: (meta.preferred_language || meta.preferredLanguage) || 'English',
      createdAt: u?.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          setProfile(mapUserToProfile(data.user));
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (session?.user && session?.mfa_verified !== false) {
          setUser(session.user);
          setProfile(mapUserToProfile(session.user));
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string; user?: any; requiresMfa?: boolean; email?: string }> => {
    try {
      const emailNorm = email.trim().toLowerCase();
      const passwordTrim = password.trim();

      if (!emailNorm || !passwordTrim) {
        return { error: 'Email and password are required.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password: passwordTrim,
      });

      if (error) return { error: error.message };

      // Local auth: password OK → MFA required (no session yet)
      if (data?.requiresMfa) {
        return { requiresMfa: true, email: data.email || emailNorm };
      }

      // Real Supabase path (if configured without MFA): session granted
      if (data?.user) {
        setUser(data.user);
        setProfile(mapUserToProfile(data.user));
        return { user: data.user };
      }

      return { error: 'Login failed.' };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const verifyMfa = async (pin: string): Promise<{ error?: string; user?: any }> => {
    try {
      if (!supabase.auth.verifyMfa) {
        return { error: 'MFA is not available.' };
      }
      const { data, error } = await supabase.auth.verifyMfa({ pin: pin.trim() });
      if (error) return { error: error.message };
      if (data?.user) {
        setUser(data.user);
        setProfile(mapUserToProfile(data.user));
        return { user: data.user };
      }
      return { error: 'MFA verification failed.' };
    } catch (err: any) {
      return { error: err.message || 'MFA verification failed.' };
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
    preferredLanguage: 'English' | 'Telugu' | 'Hindi' | 'Tamil',
    mfaPin: string
  ): Promise<{ error?: string; user?: any }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            preferred_language: preferredLanguage,
            mfa_pin: mfaPin.trim(),
          },
        },
      });
      if (error) return { error: error.message };
      if (data?.user) {
        setUser(data.user);
        setProfile(mapUserToProfile(data.user));
        return { user: data.user };
      }
      return { error: 'Account registration failed. Please try again.' };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during registration.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<{ error?: string }> => {
    try {
      if (supabase.auth.updateUser) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: data.fullName ?? profile?.fullName,
            role: data.role ?? profile?.role,
            preferred_language: data.preferredLanguage ?? profile?.preferredLanguage,
          },
        });
        if (error) return { error: error.message };
      }
      if (profile) {
        setProfile({
          ...profile,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSupabaseConfigured,
        login,
        verifyMfa,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
