import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('http')
);

const LOCAL_USERS_KEY = 'carebridge_users_v3';
const LOCAL_SESSION_KEY = 'carebridge_session_v3';
const LEGACY_KEYS = [
  'carebridge_users',
  'carebridge_session',
  'carebridge_users_v2',
  'carebridge_session_v2',
  'carebridge_pending_mfa',
];

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export let supabase: SupabaseClient | any;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client. Falling back to local storage.', err);
  }
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`);
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  preferred_language?: string;
  passwordHash: string;
  passwordSalt: string;
  failedAttempts: number;
  lockedUntil: number | null;
  created_at: string;
}

interface LocalSession {
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, string>;
  };
  access_token: string;
  expires_at: number;
}

class LocalAuthStorage {
  private listeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    this.clearLegacy();
    this.purgeExpiredSession();
  }

  private clearLegacy() {
    try {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  private purgeExpiredSession() {
    const session = this.readSession();
    if (session && session.expires_at < Date.now()) {
      this.writeSession(null);
    }
  }

  private readUsers(): StoredUser[] {
    try {
      const data = localStorage.getItem(LOCAL_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeUsers(users: StoredUser[]) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  private readSession(): LocalSession | null {
    try {
      const data = localStorage.getItem(LOCAL_SESSION_KEY);
      if (!data) return null;
      const session = JSON.parse(data) as LocalSession;
      if (!session?.user?.id) return null;
      if (session.expires_at < Date.now()) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  private writeSession(session: LocalSession | null) {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    this.notifyListeners(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  }

  private notifyListeners(event: string, session: any) {
    this.listeners.forEach((listener) => listener(event, session));
  }

  private buildPublicUser(u: StoredUser) {
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      user_metadata: {
        full_name: u.full_name,
        role: u.role,
        preferred_language: u.preferred_language || 'English',
      },
    };
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: any;
  }) {
    const trimmedEmail = normalizeEmail(email);
    const trimmedPassword = (password || '').trim();
    const fullName = (options?.data?.full_name || '').trim();

    if (!fullName) {
      return { data: { user: null, session: null }, error: { message: 'Please enter your full name.' } };
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return {
        data: { user: null, session: null },
        error: { message: 'Please enter a valid email address.' },
      };
    }
    if (!trimmedPassword || trimmedPassword.length < 8) {
      return {
        data: { user: null, session: null },
        error: { message: 'Password must be at least 8 characters.' },
      };
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(trimmedPassword)) {
      return {
        data: { user: null, session: null },
        error: { message: 'Password must include at least one letter and one number.' },
      };
    }

    const users = this.readUsers();
    if (users.find((u) => u.email === trimmedEmail)) {
      return {
        data: { user: null, session: null },
        error: { message: 'An account with this email already exists.' },
      };
    }

    const passwordSalt = randomSalt();
    const passwordHash = await hashPassword(trimmedPassword, passwordSalt);

    const stored: StoredUser = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      full_name: fullName,
      role: options?.data?.role || 'Patient',
      preferred_language: options?.data?.preferred_language || 'English',
      passwordHash,
      passwordSalt,
      failedAttempts: 0,
      lockedUntil: null,
      created_at: new Date().toISOString(),
    };

    users.push(stored);
    this.writeUsers(users);

    const publicUser = this.buildPublicUser(stored);
    const session: LocalSession = {
      user: publicUser,
      access_token: 'local-' + stored.id + '-' + randomSalt().slice(0, 8),
      expires_at: Date.now() + SESSION_TTL_MS,
    };
    this.writeSession(session);

    return { data: { user: publicUser, session }, error: null };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const trimmedEmail = normalizeEmail(email);
    const trimmedPassword = (password || '').trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return {
        data: { user: null, session: null },
        error: { message: 'Please enter a valid email address.' },
      };
    }
    if (!trimmedPassword) {
      return { data: { user: null, session: null }, error: { message: 'Please enter your password.' } };
    }

    const users = this.readUsers();
    const accountIndex = users.findIndex((u) => u.email === trimmedEmail);
    if (accountIndex < 0) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid email or password.' },
      };
    }

    const account = users[accountIndex];

    if (account.lockedUntil && account.lockedUntil > Date.now()) {
      const mins = Math.ceil((account.lockedUntil - Date.now()) / 60000);
      return {
        data: { user: null, session: null },
        error: { message: `Account temporarily locked. Try again in ${mins} minute(s).` },
      };
    }

    const candidateHash = await hashPassword(trimmedPassword, account.passwordSalt);
    if (candidateHash !== account.passwordHash) {
      account.failedAttempts = (account.failedAttempts || 0) + 1;
      if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        account.lockedUntil = Date.now() + LOCKOUT_MS;
        account.failedAttempts = 0;
      }
      users[accountIndex] = account;
      this.writeUsers(users);
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid email or password.' },
      };
    }

    account.failedAttempts = 0;
    account.lockedUntil = null;
    users[accountIndex] = account;
    this.writeUsers(users);

    const publicUser = this.buildPublicUser(account);
    const session: LocalSession = {
      user: publicUser,
      access_token: 'local-' + account.id + '-' + randomSalt().slice(0, 8),
      expires_at: Date.now() + SESSION_TTL_MS,
    };
    this.writeSession(session);

    return { data: { user: publicUser, session }, error: null };
  }

  async signOut() {
    this.writeSession(null);
    return { error: null };
  }

  async getSession() {
    return { data: { session: this.readSession() }, error: null };
  }

  async getUser() {
    const session = this.readSession();
    return { data: { user: session?.user || null }, error: null };
  }

  async updateUser({ data }: { data?: Record<string, any> }) {
    const session = this.readSession();
    if (!session?.user) {
      return { data: { user: null }, error: { message: 'Not authenticated.' } };
    }
    const users = this.readUsers();
    const idx = users.findIndex((u) => u.id === session.user.id);
    if (idx < 0) {
      return { data: { user: null }, error: { message: 'User not found.' } };
    }
    const account = users[idx];
    if (data?.full_name) account.full_name = String(data.full_name).trim();
    if (data?.role) account.role = String(data.role);
    if (data?.preferred_language) account.preferred_language = String(data.preferred_language);
    users[idx] = account;
    this.writeUsers(users);

    const publicUser = this.buildPublicUser(account);
    this.writeSession({ ...session, user: publicUser });
    return { data: { user: publicUser }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const session = this.readSession();
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }
}

const localAuth = new LocalAuthStorage();

if (!isSupabaseConfigured || !supabase) {
  supabase = {
    auth: {
      signUp: localAuth.signUp.bind(localAuth),
      signInWithPassword: localAuth.signInWithPassword.bind(localAuth),
      signOut: localAuth.signOut.bind(localAuth),
      getSession: localAuth.getSession.bind(localAuth),
      getUser: localAuth.getUser.bind(localAuth),
      updateUser: localAuth.updateUser.bind(localAuth),
      onAuthStateChange: localAuth.onAuthStateChange.bind(localAuth),
    },
  };
}

export default supabase;
