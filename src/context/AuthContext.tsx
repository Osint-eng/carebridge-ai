import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserProfile,
  updateEditableProfile,
} from '@/lib/supabase';
import { UserProfile } from '@/types';

export type EditableProfileUpdate = Partial<
  Pick<UserProfile, 'fullName' | 'preferredLanguage' | 'avatarUrl'>
>;

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; user?: any }>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    preferredLanguage: 'English' | 'Telugu' | 'Hindi' | 'Tamil'
  ) => Promise<{ error?: string; user?: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: EditableProfileUpdate) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        if (data?.user) {
          setUser(data.user);
          const resolved = await fetchUserProfile(data.user);
          if (active) setProfile(resolved);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
        if (active) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (!active) return;
        if (session?.user) {
          setUser(session.user);
          const resolved = await fetchUserProfile(session.user);
          if (active) setProfile(resolved);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string; user?: any }> => {
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

      if (data?.user) {
        setUser(data.user);
        setProfile(await fetchUserProfile(data.user));
        return { user: data.user };
      }

      return { error: 'Login failed.' };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    preferredLanguage: 'English' | 'Telugu' | 'Hindi' | 'Tamil'
  ): Promise<{ error?: string; user?: any }> => {
    try {
      // Role is never sent from the client; self-signup always provisions Patient.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            preferred_language: preferredLanguage,
          },
        },
      });
      if (error) return { error: error.message };
      if (data?.user) {
        setUser(data.user);
        setProfile(await fetchUserProfile(data.user));
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

  const updateProfile = async (data: EditableProfileUpdate): Promise<{ error?: string }> => {
    if (!profile) {
      return { error: 'Not authenticated.' };
    }
    try {
      // Strip any role field even if passed at runtime via unsafe cast
      const { role: _ignoredRole, ...safeData } = data as Partial<UserProfile>;

      const { error } = await updateEditableProfile(profile.id, {
        fullName: safeData.fullName,
        preferredLanguage: safeData.preferredLanguage,
      });
      if (error) return { error };

      setProfile({
        ...profile,
        ...(safeData.fullName ? { fullName: safeData.fullName.trim() } : {}),
        ...(safeData.preferredLanguage ? { preferredLanguage: safeData.preferredLanguage } : {}),
        ...(safeData.avatarUrl !== undefined ? { avatarUrl: safeData.avatarUrl } : {}),
        updatedAt: new Date().toISOString(),
      });
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
