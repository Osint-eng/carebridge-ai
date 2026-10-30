import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('http')
);

const LOCAL_USERS_KEY = 'carebridge_users_v2';
const LOCAL_SESSION_KEY = 'carebridge_session_v2';
const LOCAL_PENDING_MFA_KEY = 'carebridge_pending_mfa';
const LEGACY_USERS_KEY = 'carebridge_users';
const LEGACY_SESSION_KEY = 'carebridge_session';

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
  mfaEnabled: boolean;
  mfaPinHash: string;
  mfaPinSalt: string;
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
  mfa_verified: boolean;
}

class LocalAuthStorage {
  private listeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    this.migrateLegacyIfNeeded();
    this.purgeExpiredSession();
  }

  private migrateLegacyIfNeeded() {
    try {
      const legacy = localStorage.getItem(LEGACY_USERS_KEY);
      if (legacy) {
        localStorage.removeItem(LEGACY_USERS_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
      }
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
      if (!session?.user?.id || !session.mfa_verified) return null;
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

  private setPendingMfa(payload: { userId: string; email: string; expiresAt: number } | null) {
    if (payload) {
      localStorage.setItem(LOCAL_PENDING_MFA_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(LOCAL_PENDING_MFA_KEY);
    }
  }

  private getPendingMfa(): { userId: string; email: string; expiresAt: number } | null {
    try {
      const raw = localStorage.getItem(LOCAL_PENDING_MFA_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.userId || data.expiresAt < Date.now()) {
        localStorage.removeItem(LOCAL_PENDING_MFA_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
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
        mfa_enabled: String(u.mfaEnabled),
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
    const mfaPin = String(options?.data?.mfa_pin || '').trim();

    if (!fullName) {
      return { data: { user: null, session: null }, error: { message: 'Please enter your full name.' } };
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return { data: { user: null, session: null }, error: { message: 'Please enter a valid email address.' } };
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
    if (!/^\d{6}$/.test(mfaPin)) {
      return {
        data: { user: null, session: null },
        error: { message: 'MFA PIN must be exactly 6 digits.' },
      };
    }

    const users = this.readUsers();
    const existing = users.find((u) => u.email === trimmedEmail);
    if (existing) {
      return {
        data: { user: null, session: null },
        error: { message: 'An account with this email already exists.' },
      };
    }

    const passwordSalt = randomSalt();
    const mfaPinSalt = randomSalt();
    const passwordHash = await hashPassword(trimmedPassword, passwordSalt);
    const mfaPinHash = await hashPassword(mfaPin, mfaPinSalt);

    const stored: StoredUser = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      full_name: fullName,
      role: options?.data?.role || 'Patient',
      preferred_language: options?.data?.preferred_language || 'English',
      passwordHash,
      passwordSalt,
      mfaEnabled: true,
      mfaPinHash,
      mfaPinSalt,
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
      mfa_verified: true,
    };
    this.writeSession(session);
    this.setPendingMfa(null);

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
    // CRITICAL: look up by email first — never by password alone
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
    const passwordOk = candidateHash === account.passwordHash;

    if (!passwordOk) {
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

    this.setPendingMfa({
      userId: account.id,
      email: account.email,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    this.writeSession(null);

    return {
      data: {
        user: null,
        session: null,
        requiresMfa: true,
        email: account.email,
      },
      error: null,
    };
  }

  async verifyMfa({ pin }: { pin: string }) {
    const pending = this.getPendingMfa();
    if (!pending) {
      return {
        data: { user: null, session: null },
        error: { message: 'MFA session expired. Please sign in again.' },
      };
    }

    const pinTrimmed = String(pin || '').trim();
    if (!/^\d{6}$/.test(pinTrimmed)) {
      return {
        data: { user: null, session: null },
        error: { message: 'Enter your 6-digit MFA PIN.' },
      };
    }

    const users = this.readUsers();
    const accountIndex = users.findIndex((u) => u.id === pending.userId && u.email === pending.email);
    if (accountIndex < 0) {
      this.setPendingMfa(null);
      return {
        data: { user: null, session: null },
        error: { message: 'Account not found. Please sign in again.' },
      };
    }

    const account = users[accountIndex];
    const pinHash = await hashPassword(pinTrimmed, account.mfaPinSalt);
    if (pinHash !== account.mfaPinHash) {
      account.failedAttempts = (account.failedAttempts || 0) + 1;
      if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        account.lockedUntil = Date.now() + LOCKOUT_MS;
        account.failedAttempts = 0;
        this.setPendingMfa(null);
      }
      users[accountIndex] = account;
      this.writeUsers(users);
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid MFA PIN.' },
      };
    }

    account.failedAttempts = 0;
    account.lockedUntil = null;
    users[accountIndex] = account;
    this.writeUsers(users);
    this.setPendingMfa(null);

    const publicUser = this.buildPublicUser(account);
    const session: LocalSession = {
      user: publicUser,
      access_token: 'local-' + account.id + '-' + randomSalt().slice(0, 8),
      expires_at: Date.now() + SESSION_TTL_MS,
      mfa_verified: true,
    };
    this.writeSession(session);

    return { data: { user: publicUser, session }, error: null };
  }

  async signOut() {
    this.setPendingMfa(null);
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
    const nextSession: LocalSession = {
      ...session,
      user: publicUser,
    };
    this.writeSession(nextSession);
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
      verifyMfa: localAuth.verifyMfa.bind(localAuth),
      signOut: localAuth.signOut.bind(localAuth),
      getSession: localAuth.getSession.bind(localAuth),
      getUser: localAuth.getUser.bind(localAuth),
      updateUser: localAuth.updateUser.bind(localAuth),
      onAuthStateChange: localAuth.onAuthStateChange.bind(localAuth),
    },
  };
}

export default supabase;
